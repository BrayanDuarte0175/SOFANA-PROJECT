import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, CalendarRange, Trophy } from "lucide-react";
import { ACCENTS, daysUntil } from "@/lib/events";
import type { DayView } from "@/lib/events";
import type { EventRow } from "@/lib/database.types";
import { DayCard } from "@/app/(app)/torneos/[id]/day-card";
import { cn } from "@/lib/utils";

/**
 * Bloque destacado del torneo activo en la Pista Central:
 * muestra la(s) jornada(s) de HOY o la próxima.
 */
export function EventHero({
  event,
  todayDays,
  nextDay,
  todayStr,
  progress,
}: {
  event: EventRow;
  todayDays: DayView[];
  nextDay: DayView | null;
  todayStr: string;
  progress: { done: number; total: number };
}) {
  const accent = ACCENTS[event.accent];
  const until = nextDay ? daysUntil(todayStr, nextDay.day_date) : null;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border p-5 sm:p-6",
        accent.border,
      )}
      aria-label="Torneo en juego"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          accent.gradient,
        )}
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <Trophy className="size-3.5" aria-hidden />
              Torneo en juego
            </p>
            <Link
              href={`/torneos/${event.id}`}
              className="font-display text-2xl tracking-tight hover:underline sm:text-3xl"
            >
              {event.emoji ? `${event.emoji} ` : ""}
              {event.title}
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarRange className="size-4" aria-hidden />
              {format(new Date(`${event.start_date}T00:00:00`), "d MMM", { locale: es })}
              {" → "}
              {format(new Date(`${event.end_date}T00:00:00`), "d MMM", { locale: es })}
              {progress.total > 0
                ? ` · ${progress.done}/${progress.total} cumplidas`
                : ""}
            </p>
          </div>
          <Link
            href={`/torneos/${event.id}`}
            className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver torneo
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <div className="mt-4">
          {todayDays.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="font-display text-lg">Lo de hoy 🎾</p>
              {todayDays.map((day) => (
                <DayCard key={day.id} day={day} todayStr={todayStr} />
              ))}
            </div>
          ) : nextDay ? (
            <div className="flex flex-col gap-3">
              <p className="font-display text-lg">
                Próxima jornada
                {until !== null
                  ? until <= 0
                    ? " · hoy"
                    : until === 1
                      ? " · mañana"
                      : ` · en ${until} días`
                  : ""}
              </p>
              <DayCard day={nextDay} todayStr={todayStr} />
            </div>
          ) : (
            <p className="rounded-xl bg-background/60 px-4 py-3 text-sm text-muted-foreground">
              Este torneo aún no tiene jornadas. Entra y añade el primer día. 🎾
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
