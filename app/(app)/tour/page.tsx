import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/tennis/empty-state";
import { StaggerList, StaggerItem } from "@/components/motion/fade-in";
import type { ChecklistItem } from "@/lib/database.types";
import { NewTripDialog } from "./trip-forms";

export const metadata: Metadata = { title: "El Tour" };

function tripDates(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  const fmt = (d: string) =>
    format(new Date(`${d}T00:00:00`), "d MMM yyyy", { locale: es });
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  return fmt((start ?? end)!);
}

export default async function TourPage() {
  const { space } = await getSpaceContext();
  const supabase = await createClient();

  const [{ data: trips }, { data: albums }] = await Promise.all([
    supabase
      .from("trips")
      .select("*")
      .eq("space_id", space.id)
      .order("start_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("albums")
      .select("id, title")
      .eq("space_id", space.id)
      .order("created_at", { ascending: false }),
  ]);
  const albumOptions = (albums ?? []).map((a) => ({ id: a.id, title: a.title }));

  return (
    <div>
      <PageHeader
        title="El Tour"
        subtitle="Las giras de la temporada: viajes soñados, planeados y jugados."
        action={<NewTripDialog albums={albumOptions} />}
      />

      {!trips || trips.length === 0 ? (
        <EmptyState
          title="El calendario del Tour está libre"
          hint="Planea la primera gira: destino, fechas y checklist."
        />
      ) : (
        <StaggerList className="grid gap-4 sm:grid-cols-2">
          {trips.map((trip) => {
            const checklist =
              (trip.checklist as unknown as ChecklistItem[]) ?? [];
            const done = checklist.filter((i) => i.done).length;
            const when = tripDates(trip.start_date, trip.end_date);
            return (
              <StaggerItem key={trip.id}>
                <Link
                  href={`/tour/${trip.id}`}
                  className="group block h-full rounded-2xl border bg-card p-5 transition-shadow hover:shadow-lg"
                >
                  <p className="flex items-center gap-1.5 text-sm text-clay">
                    <MapPin className="size-4" aria-hidden />
                    {trip.destination}
                  </p>
                  <h2 className="mt-1 font-display text-xl">{trip.title}</h2>
                  {when ? (
                    <p className="mt-1 text-sm text-muted-foreground">{when}</p>
                  ) : null}
                  {checklist.length > 0 ? (
                    <div className="mt-4">
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={done}
                        aria-valuemin={0}
                        aria-valuemax={checklist.length}
                        aria-label="Checklist del viaje"
                      >
                        <div
                          className="h-full rounded-full bg-ball transition-all"
                          style={{ width: `${(done / checklist.length) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {done}/{checklist.length} listos
                      </p>
                    </div>
                  ) : null}
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}
    </div>
  );
}
