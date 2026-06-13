import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { signPaths } from "@/lib/storage";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/tennis/empty-state";
import { StaggerList, StaggerItem } from "@/components/motion/fade-in";
import { AddSongDialog } from "./song-forms";
import { SongCard } from "./song-card";

export const metadata: Metadata = { title: "La Playlist" };

export default async function PlaylistPage() {
  const { space, me, partner } = await getSpaceContext();
  const supabase = await createClient();

  const { data: songs } = await supabase
    .from("songs")
    .select("*")
    .eq("space_id", space.id)
    .order("created_at", { ascending: false });

  // Firma solo los audios subidos (los enlaces no se firman).
  const uploadPaths = (songs ?? [])
    .filter((s) => s.source === "upload" && s.storage_path)
    .map((s) => s.storage_path as string);
  const signed = await signPaths("music", uploadPaths);

  const profiles = [me, ...(partner ? [partner] : [])];
  const nameOf = (id: string) =>
    profiles.find((p) => p.id === id)?.display_name ?? "—";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="La Playlist"
        subtitle="La banda sonora de lo nuestro: pega un enlace de Spotify o YouTube, o sube tus propias canciones."
        action={<AddSongDialog spaceId={space.id} />}
      />

      {!songs || songs.length === 0 ? (
        <EmptyState
          title="La playlist está en silencio"
          hint="Añade la primera canción: ese tema que es solo de ustedes."
        />
      ) : (
        <StaggerList className="flex flex-col gap-4">
          {songs.map((song) => (
            <StaggerItem key={song.id}>
              <SongCard
                song={song}
                addedByName={nameOf(song.added_by)}
                audioUrl={
                  song.storage_path
                    ? (signed.get(song.storage_path) ?? null)
                    : null
                }
              />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  );
}
