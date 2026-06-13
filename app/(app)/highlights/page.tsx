import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Images, MapPin, PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { signPaths } from "@/lib/storage";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/tennis/empty-state";
import { StaggerList, StaggerItem } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { NewMemoryDialog } from "./new-memory-dialog";
import { NewAlbumDialog } from "./album-forms";

export const metadata: Metadata = { title: "Highlights" };

export default async function HighlightsPage() {
  const { space } = await getSpaceContext();
  const supabase = await createClient();

  const [{ data: albums }, { data: memories }] = await Promise.all([
    supabase
      .from("albums")
      .select("*")
      .eq("space_id", space.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("memories")
      .select("*, memory_media(id, storage_path, media_type)")
      .eq("space_id", space.id)
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  const albumOptions = (albums ?? []).map((a) => ({ id: a.id, title: a.title }));
  const albumTitle = new Map((albums ?? []).map((a) => [a.id, a.title]));

  // Portada y conteo por álbum (primera imagen del álbum).
  const albumCount = new Map<string, number>();
  const albumCover = new Map<string, string>();
  for (const m of memories ?? []) {
    if (!m.album_id) continue;
    albumCount.set(m.album_id, (albumCount.get(m.album_id) ?? 0) + 1);
    if (!albumCover.has(m.album_id)) {
      const img = m.memory_media?.find((mm) => mm.media_type === "image");
      if (img) albumCover.set(m.album_id, img.storage_path);
    }
  }

  const memoryCovers = (memories ?? [])
    .map((m) => m.memory_media?.find((mm) => mm.media_type === "image"))
    .filter((mm): mm is NonNullable<typeof mm> => Boolean(mm))
    .map((mm) => mm.storage_path);
  const signed = await signPaths("memories", [
    ...memoryCovers,
    ...albumCover.values(),
  ]);

  const hasMemories = memories && memories.length > 0;

  return (
    <div>
      <PageHeader
        title="Highlights"
        subtitle="Los mejores puntos de la temporada, guardados para siempre."
        action={
          <div className="flex gap-2">
            <NewAlbumDialog />
            <NewMemoryDialog spaceId={space.id} albums={albumOptions} />
          </div>
        }
      />

      {albums && albums.length > 0 ? (
        <section className="mb-8" aria-label="Álbumes">
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
            <Images className="size-5" aria-hidden />
            Álbumes
          </h2>
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => {
              const coverPath = albumCover.get(album.id);
              const coverUrl = coverPath ? signed.get(coverPath) : null;
              const count = albumCount.get(album.id) ?? 0;
              return (
                <StaggerItem key={album.id}>
                  <Link
                    href={`/highlights/album/${album.id}`}
                    className="group block overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg"
                  >
                    <div className="relative">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverUrl}
                          alt=""
                          loading="lazy"
                          className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="court-texture flex aspect-[16/9] w-full items-center justify-center bg-secondary text-4xl">
                          📸
                        </div>
                      )}
                      <span className="absolute right-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-xs font-medium backdrop-blur">
                        {count} {count === 1 ? "recuerdo" : "recuerdos"}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-lg leading-snug">
                        {album.title}
                      </h3>
                      {album.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {album.description}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerList>
        </section>
      ) : null}

      {!hasMemories ? (
        <EmptyState
          title="La galería está esperando su primer punto"
          hint="Sube fotos o videos de un momento que quieran recordar."
        />
      ) : (
        <>
          {albums && albums.length > 0 ? (
            <h2 className="mb-3 font-display text-xl">Todos los highlights</h2>
          ) : null}
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memories.map((m) => {
              const cover = m.memory_media?.find((mm) => mm.media_type === "image");
              const coverUrl = cover ? signed.get(cover.storage_path) : null;
              const hasVideo = m.memory_media?.some((mm) => mm.media_type === "video");
              return (
                <StaggerItem key={m.id}>
                  <Link
                    href={`/highlights/${m.id}`}
                    className="group block overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg"
                  >
                    <div className="relative">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverUrl}
                          alt=""
                          loading="lazy"
                          className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="court-texture flex aspect-[4/3] w-full items-center justify-center bg-secondary text-4xl">
                          🎾
                        </div>
                      )}
                      {hasVideo ? (
                        <span className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur">
                          <PlayCircle className="size-4" aria-label="Incluye video" />
                        </span>
                      ) : null}
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-lg leading-snug">{m.title}</h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                        {m.event_date
                          ? format(new Date(`${m.event_date}T00:00:00`), "d 'de' MMMM yyyy", { locale: es })
                          : null}
                        {m.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" aria-hidden />
                            {m.location}
                          </span>
                        ) : null}
                      </p>
                      {m.album_id && albumTitle.has(m.album_id) ? (
                        <Badge variant="secondary" className="mt-2">
                          <Images className="size-3" aria-hidden />
                          {albumTitle.get(m.album_id)}
                        </Badge>
                      ) : null}
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerList>
        </>
      )}
    </div>
  );
}
