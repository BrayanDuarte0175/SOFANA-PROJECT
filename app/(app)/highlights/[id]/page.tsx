import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CalendarDays, Images, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { signPaths } from "@/lib/storage";
import { CourtLine } from "@/components/tennis/court-line";
import { FadeIn } from "@/components/motion/fade-in";
import { ReactionsBar } from "@/components/app/reactions-bar";
import { CommentsSection } from "@/components/app/comments-section";
import { MemoryActions } from "./memory-actions";
import { MediaGrid } from "./media-grid";

export const metadata: Metadata = { title: "Highlight" };

export default async function MemoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { space, me, partner, userId } = await getSpaceContext();
  const supabase = await createClient();

  const { data: memory } = await supabase
    .from("memories")
    .select("*, memory_media(id, storage_path, media_type, created_at)")
    .eq("id", id)
    .eq("space_id", space.id)
    .maybeSingle();

  if (!memory) notFound();

  const [{ data: comments }, { data: reactions }, { data: albums }] =
    await Promise.all([
      supabase
        .from("comments")
        .select("*")
        .eq("target_type", "memory")
        .eq("target_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("reactions")
        .select("*")
        .eq("target_type", "memory")
        .eq("target_id", id),
      supabase
        .from("albums")
        .select("id, title")
        .eq("space_id", space.id)
        .order("created_at", { ascending: false }),
    ]);

  const albumOptions = (albums ?? []).map((a) => ({ id: a.id, title: a.title }));
  const memoryAlbum = albums?.find((a) => a.id === memory.album_id) ?? null;

  const media = memory.memory_media ?? [];
  const signed = await signPaths(
    "memories",
    media.map((m) => m.storage_path),
  );
  const items = media.map((m) => ({
    id: m.id,
    type: m.media_type,
    url: signed.get(m.storage_path) ?? null,
  }));

  const profiles = [me, ...(partner ? [partner] : [])];
  const author = profiles.find((p) => p.id === memory.author_id);

  return (
    <div className="mx-auto max-w-3xl">
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
            <h1 className="font-display text-3xl tracking-tight">
              {memory.title}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {memory.event_date ? (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-4" aria-hidden />
                  {format(new Date(`${memory.event_date}T00:00:00`), "d 'de' MMMM yyyy", { locale: es })}
                </span>
              ) : null}
              {memory.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" aria-hidden />
                  {memory.location}
                </span>
              ) : null}
              {author ? <span>Guardado por {author.display_name}</span> : null}
            </p>
            {memoryAlbum ? (
              <Link
                href={`/highlights/album/${memoryAlbum.id}`}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground transition-colors hover:bg-accent"
              >
                <Images className="size-3.5" aria-hidden />
                {memoryAlbum.title}
              </Link>
            ) : null}
          </div>
          <MemoryActions memory={memory} spaceId={space.id} albums={albumOptions} />
        </div>

        {memory.description ? (
          <p className="mt-4 whitespace-pre-wrap leading-relaxed">
            {memory.description}
          </p>
        ) : null}

        <div className="mt-6">
          <MediaGrid items={items} />
        </div>

        <div className="mt-6">
          <ReactionsBar
            targetType="memory"
            targetId={memory.id}
            reactions={reactions ?? []}
            userId={userId}
          />
        </div>

        <CourtLine />

        <CommentsSection
          targetType="memory"
          targetId={memory.id}
          comments={comments ?? []}
          profiles={profiles}
        />
      </FadeIn>
    </div>
  );
}
