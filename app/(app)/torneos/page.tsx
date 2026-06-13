import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { ACCENTS, daysBetweenInclusive, localDateStr } from "@/lib/events";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/tennis/empty-state";
import { StaggerList, StaggerItem } from "@/components/motion/fade-in";
import { NewEventDialog } from "./event-forms";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Torneos" };

export default async function TorneosPage() {
  const { space } = await getSpaceContext();
  const supabase = await createClient();
  const todayStr = localDateStr(new Date());

  const { data: events } = await supabase
    .from("events")
    .select("*, event_days(id, done)")
    .eq("space_id", space.id)
    .order("status", { ascending: true })
    .order("start_date", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Torneos"
        subtitle="Eventos de varios días: cada jornada, un plan, una sorpresa, un detalle."
        action={<NewEventDialog />}
      />

      {!events || events.length === 0 ? (
        <EmptyState
          title="Aún no hay torneos"
          hint="Crea el primero: por ejemplo, “30 días contigo”."
        />
      ) : (
        <StaggerList className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => {
            const accent = ACCENTS[event.accent];
            const total = event.event_days?.length ?? 0;
            const done = event.event_days?.filter((d) => d.done).length ?? 0;
            const span = daysBetweenInclusive(event.start_date, event.end_date);
            const active =
              event.status === "active" &&
              todayStr >= event.start_date &&
              todayStr <= event.end_date;
            return (
              <StaggerItem key={event.id}>
                <Link
                  href={`/torneos/${event.id}`}
                  className={cn(
                    "group relative block h-full overflow-hidden rounded-2xl border p-5 transition-shadow hover:shadow-lg",
                    accent.border,
                  )}
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-gradient-to-br",
                      accent.gradient,
                    )}
                    aria-hidden
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-3xl">{event.emoji ?? "🏆"}</span>
                      {active ? (
                        <span className="rounded-full bg-ball px-2 py-0.5 text-xs font-medium text-ball-foreground">
                          En juego
                        </span>
                      ) : event.status === "archived" ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Archivado
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-2 font-display text-xl">{event.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {format(new Date(`${event.start_date}T00:00:00`), "d MMM", { locale: es })}
                      {" → "}
                      {format(new Date(`${event.end_date}T00:00:00`), "d MMM yyyy", { locale: es })}
                      {" · "}
                      {span} días
                    </p>
                    {total > 0 ? (
                      <div className="mt-4">
                        <div
                          className="h-1.5 overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-valuenow={done}
                          aria-valuemin={0}
                          aria-valuemax={total}
                        >
                          <div
                            className={cn("h-full rounded-full", accent.dot)}
                            style={{ width: `${(done / total) * 100}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {done}/{total} jornadas cumplidas
                        </p>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-muted-foreground">
                        Sin jornadas todavía
                      </p>
                    )}
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}
    </div>
  );
}
