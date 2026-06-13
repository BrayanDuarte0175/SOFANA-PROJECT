"use client";

import { createClient } from "@/lib/supabase/client";
import {
  IMAGE_TYPES,
  VIDEO_TYPES,
  AUDIO_TYPES,
  MAX_FILE_BYTES,
  MAX_AVATAR_BYTES,
  MAX_AUDIO_BYTES,
} from "@/lib/storage-constants";
import type { MediaType } from "@/lib/database.types";

export interface UploadedMedia {
  path: string;
  type: MediaType;
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  return fromName && fromName.length <= 5 ? fromName : "bin";
}

/**
 * Sube archivos DIRECTO al bucket privado desde el navegador.
 * El RLS de storage solo permite escribir dentro de la carpeta del
 * space, y el bucket rechaza tipos/tamaños no permitidos.
 */
export async function uploadMedia(
  bucket: "memories" | "vault",
  spaceId: string,
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ uploaded: UploadedMedia[]; errors: string[] }> {
  const supabase = createClient();
  const uploaded: UploadedMedia[] = [];
  const errors: string[] = [];

  let done = 0;
  for (const file of files) {
    const type: MediaType | null = IMAGE_TYPES.includes(file.type)
      ? "image"
      : VIDEO_TYPES.includes(file.type)
        ? "video"
        : null;

    if (!type) {
      errors.push(`${file.name}: tipo no permitido (solo fotos y videos).`);
    } else if (file.size > MAX_FILE_BYTES) {
      errors.push(`${file.name}: supera el máximo de 50 MB.`);
    } else {
      const path = `${spaceId}/${crypto.randomUUID()}.${extensionFor(file)}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        errors.push(`${file.name}: ${error.message}`);
      } else {
        uploaded.push({ path, type });
      }
    }
    done += 1;
    onProgress?.(done, files.length);
  }

  return { uploaded, errors };
}

/** Sube un archivo de audio al bucket privado `music`. Devuelve el path. */
export async function uploadAudio(
  spaceId: string,
  file: File,
): Promise<{ path?: string; error?: string }> {
  if (!AUDIO_TYPES.includes(file.type)) {
    return { error: "Formato no permitido. Usa MP3, M4A, WAV, OGG o FLAC." };
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return { error: "El archivo supera el máximo de 100 MB." };
  }
  const supabase = createClient();
  const path = `${spaceId}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from("music")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: error.message };
  return { path };
}

/** Sube el avatar propio (carpeta = user id). Devuelve el path. */
export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ path?: string; error?: string }> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { error: "El avatar debe ser JPG, PNG o WebP." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "El avatar no puede superar 5 MB." };
  }
  const supabase = createClient();
  const path = `${userId}/avatar-${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) return { error: error.message };
  return { path };
}
