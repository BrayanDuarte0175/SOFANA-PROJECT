"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { notifyPartner } from "@/lib/notify";
import type { MediaType } from "@/lib/database.types";

export interface MediaInput {
  path: string;
  type: MediaType;
}

function assertInSpace(paths: MediaInput[], spaceId: string) {
  for (const m of paths) {
    if (!m.path.startsWith(`${spaceId}/`)) {
      throw new Error("Ruta de archivo fuera del space");
    }
  }
}

export async function createMemory(input: {
  title: string;
  description?: string;
  event_date?: string;
  location?: string;
  album_id?: string | null;
  media: MediaInput[];
}) {
  const { space, userId } = await getSpaceContext();
  const supabase = await createClient();

  const title = input.title.trim();
  if (!title) return { error: "El título es obligatorio." };
  assertInSpace(input.media, space.id);

  const { data: memory, error } = await supabase
    .from("memories")
    .insert({
      space_id: space.id,
      author_id: userId,
      title,
      description: input.description?.trim() || null,
      event_date: input.event_date || null,
      location: input.location?.trim() || null,
      album_id: input.album_id || null,
    })
    .select()
    .single();
  if (error) return { error: error.message };

  if (input.media.length > 0) {
    const { error: mediaError } = await supabase.from("memory_media").insert(
      input.media.map((m) => ({
        memory_id: memory.id,
        storage_path: m.path,
        media_type: m.type,
      })),
    );
    if (mediaError) return { error: mediaError.message };
  }

  await notifyPartner({
    type: "memory",
    title: "Nuevo highlight 🎾",
    body: title,
    href: `/highlights/${memory.id}`,
  });

  revalidatePath("/highlights");
  revalidatePath("/pista");
  return { id: memory.id };
}

export async function updateMemory(
  id: string,
  fields: {
    title?: string;
    description?: string | null;
    event_date?: string | null;
    location?: string | null;
    album_id?: string | null;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("memories").update(fields).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/highlights");
  revalidatePath(`/highlights/${id}`);
  return {};
}

export async function addMemoryMedia(memoryId: string, media: MediaInput[]) {
  const { space } = await getSpaceContext();
  assertInSpace(media, space.id);
  const supabase = await createClient();
  const { error } = await supabase.from("memory_media").insert(
    media.map((m) => ({
      memory_id: memoryId,
      storage_path: m.path,
      media_type: m.type,
    })),
  );
  if (error) return { error: error.message };
  revalidatePath(`/highlights/${memoryId}`);
  return {};
}

export async function deleteMemoryMedia(mediaId: string) {
  const supabase = await createClient();
  const { data: media } = await supabase
    .from("memory_media")
    .select("id, memory_id, storage_path")
    .eq("id", mediaId)
    .maybeSingle();
  if (!media) return { error: "No encontrado" };

  await supabase.storage.from("memories").remove([media.storage_path]);
  const { error } = await supabase
    .from("memory_media")
    .delete()
    .eq("id", mediaId);
  if (error) return { error: error.message };
  revalidatePath(`/highlights/${media.memory_id}`);
  return {};
}

export async function deleteMemory(id: string) {
  const supabase = await createClient();

  const { data: media } = await supabase
    .from("memory_media")
    .select("storage_path")
    .eq("memory_id", id);
  if (media && media.length > 0) {
    await supabase.storage
      .from("memories")
      .remove(media.map((m) => m.storage_path));
  }

  const { error } = await supabase.from("memories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/highlights");
  revalidatePath("/pista");
  return {};
}
