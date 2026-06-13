"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { notifyPartner } from "@/lib/notify";
import { parseMusicLink } from "@/lib/music";

/** Intenta autocompletar título/artista vía oEmbed (best-effort). */
async function fetchOEmbed(
  url: string | null,
): Promise<{ title?: string; author?: string }> {
  if (!url) return {};
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "SOFANA" },
      // No cachear: es solo para autocompletar al crear.
      cache: "no-store",
    });
    if (!res.ok) return {};
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
    };
    return { title: data.title, author: data.author_name };
  } catch {
    return {};
  }
}

export async function addSongLink(input: {
  url: string;
  title?: string;
  artist?: string;
  note?: string;
}) {
  const parsed = parseMusicLink(input.url);
  if (!parsed) {
    return {
      error:
        "No reconocí ese enlace. Pega uno de Spotify o YouTube / YouTube Music.",
    };
  }

  const { space, userId } = await getSpaceContext();

  let title = input.title?.trim() ?? "";
  let artist = input.artist?.trim() ?? "";

  if (!title || !artist) {
    const meta = await fetchOEmbed(parsed.oembedUrl);
    if (!title && meta.title) title = meta.title;
    if (!artist && meta.author) artist = meta.author;
  }
  if (!title) {
    title = parsed.source === "spotify" ? "Canción de Spotify" : "Video de YouTube";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("songs").insert({
    space_id: space.id,
    added_by: userId,
    title: title.slice(0, 200),
    artist: artist ? artist.slice(0, 160) : null,
    source: parsed.source,
    embed_kind: parsed.kind,
    external_id: parsed.externalId,
    external_url: parsed.url,
    note: input.note?.trim() || null,
  });
  if (error) return { error: error.message };

  await notifyPartner({
    type: "song",
    title: "Nueva canción en la Playlist 🎵",
    body: artist ? `${title} · ${artist}` : title,
    href: "/playlist",
  });
  revalidatePath("/playlist");
  return {};
}

export async function addSongUpload(input: {
  path: string;
  title: string;
  artist?: string;
  note?: string;
}) {
  const { space, userId } = await getSpaceContext();
  if (!input.path.startsWith(`${space.id}/`)) {
    return { error: "Ruta de archivo fuera del space" };
  }
  const title = input.title.trim();
  if (!title) return { error: "Ponle un título a la canción." };

  const supabase = await createClient();
  const { error } = await supabase.from("songs").insert({
    space_id: space.id,
    added_by: userId,
    title: title.slice(0, 200),
    artist: input.artist?.trim()?.slice(0, 160) || null,
    source: "upload",
    storage_path: input.path,
    note: input.note?.trim() || null,
  });
  if (error) return { error: error.message };

  await notifyPartner({
    type: "song",
    title: "Nueva canción en la Playlist 🎵",
    body: title,
    href: "/playlist",
  });
  revalidatePath("/playlist");
  return {};
}

export async function updateSong(
  id: string,
  fields: { title?: string; artist?: string | null; note?: string | null },
) {
  const payload = {
    ...(fields.title !== undefined ? { title: fields.title.trim().slice(0, 200) } : {}),
    ...(fields.artist !== undefined
      ? { artist: fields.artist?.trim().slice(0, 160) || null }
      : {}),
    ...(fields.note !== undefined ? { note: fields.note?.trim() || null } : {}),
  };
  const supabase = await createClient();
  const { error } = await supabase.from("songs").update(payload).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/playlist");
  return {};
}

export async function deleteSong(id: string) {
  const supabase = await createClient();
  const { data: song } = await supabase
    .from("songs")
    .select("source, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (song?.source === "upload" && song.storage_path) {
    await supabase.storage.from("music").remove([song.storage_path]);
  }

  const { error } = await supabase.from("songs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/playlist");
  return {};
}
