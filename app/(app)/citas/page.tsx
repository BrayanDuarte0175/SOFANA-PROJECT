import type { Metadata } from "next";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/tennis/empty-state";
import { StaggerList, StaggerItem } from "@/components/motion/fade-in";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourtLine } from "@/components/tennis/court-line";
import { DateDialog, DateActions } from "./date-forms";

export const metadata: Metadata = { title: "Próximos partidos" };

export default async function CitasPage() {
  const { space } = await getSpaceContext();
  const supabase = await createClient();

  const { data: dates } = await supabase
    .from("dates")
    .select("*")
    .eq("space_id", space.id)
    .order("scheduled_at", { ascending: true });

  const now = new Date().getTime();
  const upcoming = (dates ?? []).filter(
    (d) => d.status === "scheduled" && new Date(d.scheduled_at).getTime() >= now,
  );
  const past = (dates ?? [])
    .filter(
      (d) => d.status !== "scheduled" || new Date(d.scheduled_at).getTime() < now,
    )
    .reverse();

  const next = upcoming[0];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Próximos partidos"
        subtitle="La agenda de citas: que ningún partido se juegue sin avisar."
        action={<DateDialog />}
      />

      {next ? (
        <div className="rounded-2xl bg-court p-5 text-line">
          <p className="text-xs uppercase tracking-widest opacity-80">
            Siguiente partido
          </p>
          <p className="mt-1 font-display text-2xl">{next.title}</p>
          <p className="mt-1 text-sm opacity-90">
            {format(new Date(next.scheduled_at), "EEEE d 'de' MMMM · HH:mm", { locale: es })}
            {next.location ? ` · ${next.location}` : ""}
          </p>
          <p className="mt-2 inline-block rounded-full bg-ball px-3 py-1 text-sm font-medium text-ball-foreground">
            {formatDistanceToNow(new Date(next.scheduled_at), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        </div>
      ) : null}

      <h2 className="mt-8 font-display text-xl">En el calendario</h2>
      {upcoming.length === 0 ? (
        <EmptyState
          title="No hay partidos agendados"
          hint="Agenda la próxima cita: cena, cine o un partido de verdad."
          className="mt-3"
        />
      ) : (
        <StaggerList className="mt-3 flex flex-col gap-3">
          {upcoming.map((d) => (
            <StaggerItem key={d.id}>
              <Card>
                <CardContent className="flex items-start justify-between gap-3 pt-6">
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" aria-hidden />
                        {format(new Date(d.scheduled_at), "EEE d MMM · HH:mm", { locale: es })}
                      </span>
                      {d.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden />
                          {d.location}
                        </span>
                      ) : null}
                    </p>
                    {d.notes ? (
                      <p className="mt-2 text-sm text-muted-foreground">{d.notes}</p>
                    ) : null}
                  </div>
                  <DateActions date={d} />
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      {past.length > 0 ? (
        <>
          <CourtLine />
          <h2 className="font-display text-xl">Partidos jugados</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {past.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
              >
                <div>
                  <p className={d.status === "cancelled" ? "line-through opacity-70" : ""}>
                    {d.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(d.scheduled_at), "d MMM yyyy · HH:mm", { locale: es })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {d.status === "done" ? (
                    <Badge variant="secondary">Jugado</Badge>
                  ) : d.status === "cancelled" ? (
                    <Badge variant="outline">Suspendido</Badge>
                  ) : (
                    <Badge variant="outline">Pendiente de marcar</Badge>
                  )}
                  <DateActions date={d} />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
