import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Images, MapPin, PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { signPaths } from "@/lib/storage";
import { FadeIn } from "@/components/motion/fade-in";
import { CourtLine } from "@/components/tennis/court-line";
import { EmptyState } from "@/components/tennis/empty-state";
import { StaggerList, StaggerItem } from "@/components/motion/fade-in";
import { NewMemoryDialog } from "../../new-memory-dialog";
import { AlbumActions } from "../../album-forms";

export const metadata: Metadata = { title: "Álbum" };

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { space } = await getSpaceContext();
  const supabase = await createClient();

  const { data: album } = await supabase
    .from("albums")
    .select("*")
    .eq("id", id)
    .eq("space_id", space.id)
    .maybeSingle();
  if (!album) notFound();

  const [{ data: memories }, { data: allAlbums }] = await Promise.all([
    supabase
      .from("memories")
      .select("*, memory_media(id, storage_path, media_type)")
      .eq("space_id", space.id)
      .eq("album_id", id)
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("albums")
      .select("id, title")
      .eq("space_id", space.id)
      .order("created_at", { ascending: false }),
  ]);

  const covers = (memories ?? [])
    .map((m) => m.memory_media?.find((mm) => mm.media_type === "image"))
    .filter((mm): mm is NonNullable<typeof mm> => Boolean(mm))
    .map((mm) => mm.storage_path);
  const signed = await signPaths("memories", covers);

  return (
    <div>
      <FadeIn>
        <Link
          href="/highlights"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Todos los highlights
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Images className="size-4" aria-hidden />
              Álbum
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-tight">
              {album.title}
            </h1>
            {album.description ? (
              <p className="mt-2 max-w-prose whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {album.description}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <NewMemoryDialog
              spaceId={space.id}
              albums={(allAlbums ?? []).map((a) => ({ id: a.id, title: a.title }))}
              defaultAlbumId={album.id}
            />
            <AlbumActions album={album} />
          </div>
        </div>

        <CourtLine />

        {!memories || memories.length === 0 ? (
          <EmptyState
            title="Este álbum está vacío"
            hint="Crea un highlight aquí, o asigna este álbum al editar un highlight existente."
          />
        ) : (
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
                      <h2 className="font-display text-lg leading-snug">{m.title}</h2>
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
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerList>
        )}
      </FadeIn>
    </div>
  );
}
