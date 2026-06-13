"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { notifyPartner } from "@/lib/notify";
import type { MediaType } from "@/lib/database.types";

export async function addVaultMedia(
  items: { path: string; type: MediaType; caption?: string }[],
) {
  const { space, userId } = await getSpaceContext();
  for (const item of items) {
    if (!item.path.startsWith(`${space.id}/`)) {
      return { error: "Ruta de archivo fuera del space" };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vault_media").insert(
    items.map((item) => ({
      space_id: space.id,
      owner_id: userId,
      storage_path: item.path,
      media_type: item.type,
      caption: item.caption?.trim() || null,
    })),
  );
  if (error) return { error: error.message };
  await notifyPartner({
    type: "vault",
    title: "Algo nuevo en el Vault 🔒",
    body:
      items.length === 1
        ? "Subió 1 recuerdo privado"
        : `Subió ${items.length} recuerdos privados`,
    href: "/vault",
  });
  revalidatePath("/vault");
  return {};
}

export async function updateVaultCaption(id: string, caption: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vault_media")
    .update({ caption: caption.trim() || null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/vault");
  return {};
}

export async function deleteVaultMedia(id: string) {
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("vault_media")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!item) return { error: "No encontrado" };

  await supabase.storage.from("vault").remove([item.storage_path]);
  const { error } = await supabase.from("vault_media").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/vault");
  return {};
}
