"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";

export async function createAlbum(input: {
  title: string;
  description?: string;
}) {
  const title = input.title.trim();
  if (!title) return { error: "Ponle un nombre al álbum." };

  const { space, userId } = await getSpaceContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("albums")
    .insert({
      space_id: space.id,
      created_by: userId,
      title: title.slice(0, 140),
      description: input.description?.trim() || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/highlights");
  return { id: data.id };
}

export async function updateAlbum(
  id: string,
  fields: { title?: string; description?: string | null },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("albums").update(fields).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/highlights");
  revalidatePath(`/highlights/album/${id}`);
  return {};
}

export async function deleteAlbum(id: string) {
  const supabase = await createClient();
  // on delete set null: los highlights y viajes NO se borran, se
  // desvinculan del álbum.
  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/highlights");
  revalidatePath("/tour");
  return {};
}
