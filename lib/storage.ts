import { createClient } from "@/lib/supabase/server";
import { IMAGE_TYPES, VIDEO_TYPES } from "@/lib/storage-constants";

/** Vida corta de las signed URLs (segundos). */
export const SIGNED_URL_TTL = 60 * 10;

export function mediaTypeFor(mime: string): "image" | "video" | null {
  if (IMAGE_TYPES.includes(mime)) return "image";
  if (VIDEO_TYPES.includes(mime)) return "video";
  return null;
}

/**
 * Genera signed URLs para un conjunto de paths de un bucket privado.
 * Se ejecuta SOLO en el servidor con la sesión del usuario: las
 * políticas de storage garantizan que solo firma lo de su space.
 */
export async function signPaths(
  bucket: "memories" | "vault" | "avatars" | "music",
  paths: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (paths.length === 0) return result;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, SIGNED_URL_TTL);

  if (error || !data) return result;
  for (const item of data) {
    if (item.signedUrl && item.path) result.set(item.path, item.signedUrl);
  }
  return result;
}

export async function signPath(
  bucket: "memories" | "vault" | "avatars" | "music",
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  const map = await signPaths(bucket, [path]);
  return map.get(path) ?? null;
}
