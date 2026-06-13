"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";

export async function updateDisplayName(name: string) {
  const displayName = name.trim().slice(0, 60);
  if (!displayName) return { error: "El nombre no puede estar vacío." };

  const { userId } = await getSpaceContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

export async function updateAvatar(path: string) {
  const { userId } = await getSpaceContext();
  if (!path.startsWith(`${userId}/`)) {
    return { error: "Ruta de avatar inválida" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: path })
    .eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

export async function updateSpaceName(name: string) {
  const clean = name.trim().slice(0, 80);
  if (!clean) return { error: "El nombre no puede estar vacío." };
  const { space } = await getSpaceContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("spaces")
    .update({ name: clean })
    .eq("id", space.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}
