import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import {
  ACCENTS,
  daysBetweenInclusive,
  localDateStr,
  toDayView,
} from "@/lib/events";
import { FadeIn } from "@/components/motion/fade-in";
import { EventActions } from "../event-forms";
import { DaysTimeline } from "./days-timeline";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Torneo" };

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { space, userId } = await getSpaceContext();
  const supabase = await createClient();
  const todayStr = localDateStr(new Date());

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("space_id", space.id)
    .maybeSingle();
  if (!event) notFound();

  const { data: rawDays } = await supabase
    .from("event_days")
    .select("*")
    .eq("event_id", id)
    .order("day_date", { ascending: true })
    .order("created_at", { ascending: true });

  // Convierte a vistas seguras: las sorpresas selladas NO traen contenido.
  const days = (rawDays ?? []).map((d) =>
    toDayView(d, userId, todayStr, event.is_shared),
  );
  const canAdd = event.is_shared || event.created_by === userId;
  const total = days.length;
  const done = days.filter((d) => d.done).length;
  const accent = ACCENTS[event.accent];
  const span = daysBetweenInclusive(event.start_date, event.end_date);

  return (
    <div className="mx-auto max-w-2xl">
      <FadeIn>
        <Link
          href="/torneos"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Todos los torneos
        </Link>

        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border p-6",
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
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <span className="text-4xl">{event.emoji ?? "🏆"}</span>
              <h1 className="mt-2 font-display text-3xl tracking-tight">
                {event.title}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarRange className="size-4" aria-hidden />
                {format(new Date(`${event.start_date}T00:00:00`), "d 'de' MMM", { locale: es })}
                {" → "}
                {format(new Date(`${event.end_date}T00:00:00`), "d 'de' MMM yyyy", { locale: es })}
                {" · "}
                {span} días
              </p>
            </div>
            <EventActions event={event} />
          </div>

          {event.description ? (
            <p className="relative mt-3 whitespace-pre-wrap leading-relaxed">
              {event.description}
            </p>
          ) : null}

          {total > 0 ? (
            <div className="relative mt-5">
              <div
                className="h-2 overflow-hidden rounded-full bg-background/60"
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
          ) : null}
        </div>

        <div className="mt-6">
          <DaysTimeline
            eventId={event.id}
            days={days}
            todayStr={todayStr}
            canAdd={canAdd}
            defaultDate={
              todayStr >= event.start_date && todayStr <= event.end_date
                ? todayStr
                : event.start_date
            }
          />
        </div>
      </FadeIn>
    </div>
  );
}
