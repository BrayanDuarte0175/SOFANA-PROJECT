import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CalendarDays, Images, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { signPaths } from "@/lib/storage";
import type { ChecklistItem } from "@/lib/database.types";
import { FadeIn } from "@/components/motion/fade-in";
import { CourtLine } from "@/components/tennis/court-line";
import { TripActions } from "../trip-forms";
import { TripChecklist } from "./trip-checklist";

export const metadata: Metadata = { title: "El Tour" };

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { space } = await getSpaceContext();
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .eq("space_id", space.id)
    .maybeSingle();

  if (!trip) notFound();

  // Álbumes para el formulario de edición.
  const { data: albums } = await supabase
    .from("albums")
    .select("id, title")
    .eq("space_id", space.id)
    .order("created_at", { ascending: false });
  const albumOptions = (albums ?? []).map((a) => ({ id: a.id, title: a.title }));

  // Álbum enlazado + sus fotos (si lo hay).
  let linkedAlbum: { id: string; title: string } | null = null;
  let albumPhotos: { id: string; url: string | null }[] = [];
  if (trip.album_id) {
    const { data: album } = await supabase
      .from("albums")
      .select("id, title")
      .eq("id", trip.album_id)
      .maybeSingle();
    linkedAlbum = album ?? null;

    if (album) {
      const { data: mems } = await supabase
        .from("memories")
        .select("id, memory_media(storage_path, media_type)")
        .eq("space_id", space.id)
        .eq("album_id", album.id)
        .order("event_date", { ascending: false, nullsFirst: false })
        .limit(8);
      const photoPaths = (mems ?? [])
        .map((m) => m.memory_media?.find((mm) => mm.media_type === "image"))
        .filter((mm): mm is NonNullable<typeof mm> => Boolean(mm))
        .map((mm) => mm.storage_path);
      const signed = await signPaths("memories", photoPaths);
      albumPhotos = (mems ?? []).map((m) => {
        const img = m.memory_media?.find((mm) => mm.media_type === "image");
        return { id: m.id, url: img ? (signed.get(img.storage_path) ?? null) : null };
      });
    }
  }

  const fmt = (d: string) =>
    format(new Date(`${d}T00:00:00`), "d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="mx-auto max-w-2xl">
      <FadeIn>
        <Link
          href="/tour"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Todas las giras
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-clay">
              <MapPin className="size-4" aria-hidden />
              {trip.destination}
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-tight">
              {trip.title}
            </h1>
            {trip.start_date || trip.end_date ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden />
                {trip.start_date ? fmt(trip.start_date) : "—"}
                {trip.end_date ? ` → ${fmt(trip.end_date)}` : ""}
              </p>
            ) : null}
          </div>
          <TripActions trip={trip} albums={albumOptions} />
        </div>

        {trip.notes ? (
          <p className="mt-4 whitespace-pre-wrap leading-relaxed">{trip.notes}</p>
        ) : null}

        {linkedAlbum ? (
          <div className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-xl">
                <Images className="size-5" aria-hidden />
                Fotos del viaje
              </h2>
              <Link
                href={`/highlights/album/${linkedAlbum.id}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Ver álbum «{linkedAlbum.title}»
              </Link>
            </div>
            {albumPhotos.length > 0 ? (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {albumPhotos.map((p) => (
                  <Link
                    key={p.id}
                    href={`/highlights/${p.id}`}
                    className="block overflow-hidden rounded-xl border bg-muted"
                  >
                    {p.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.url}
                        alt=""
                        loading="lazy"
                        className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-2xl">
                        🎾
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                El álbum «{linkedAlbum.title}» aún no tiene fotos. Añade
                highlights a ese álbum y aparecerán aquí.
              </p>
            )}
          </div>
        ) : null}

        <CourtLine />

        <TripChecklist
          tripId={trip.id}
          initial={(trip.checklist as unknown as ChecklistItem[]) ?? []}
        />
      </FadeIn>
    </div>
  );
}
