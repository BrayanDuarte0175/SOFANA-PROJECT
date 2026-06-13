import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, CalendarHeart, Medal, MessagesSquare, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { signPaths } from "@/lib/storage";
import { localDateStr, toDayView } from "@/lib/events";
import { EventHero } from "@/components/app/event-hero";
import { Scoreboard } from "@/components/tennis/scoreboard";
import { EmptyState } from "@/components/tennis/empty-state";
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Pista Central" };

export default async function PistaPage() {
  const { space, me, partner, userId } = await getSpaceContext();
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const todayStr = localDateStr(new Date());

  // Torneo destacado: el activo que cubre hoy, o el más próximo.
  const { data: activeEvents } = await supabase
    .from("events")
    .select("*")
    .eq("space_id", space.id)
    .eq("status", "active")
    .gte("end_date", todayStr)
    .order("start_date", { ascending: true })
    .limit(6);
  const featured =
    activeEvents?.find(
      (e) => todayStr >= e.start_date && todayStr <= e.end_date,
    ) ??
    activeEvents?.[0] ??
    null;

  let heroDays: ReturnType<typeof toDayView>[] = [];
  if (featured) {
    const { data: rawDays } = await supabase
      .from("event_days")
      .select("*")
      .eq("event_id", featured.id)
      .order("day_date", { ascending: true })
      .order("created_at", { ascending: true });
    heroDays = (rawDays ?? []).map((d) =>
      toDayView(d, userId, todayStr, featured.is_shared),
    );
  }
  const heroToday = heroDays.filter((d) => d.day_date === todayStr);
  const heroNext = heroDays.find((d) => d.day_date > todayStr) ?? null;
  const heroProgress = {
    done: heroDays.filter((d) => d.done).length,
    total: heroDays.length,
  };

  const [dates, memories, questions, promises, counts] = await Promise.all([
    supabase
      .from("dates")
      .select("*")
      .eq("space_id", space.id)
      .eq("status", "scheduled")
      .gte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(3),
    supabase
      .from("memories")
      .select("*, memory_media(storage_path, media_type)")
      .eq("space_id", space.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("questions")
      .select("*")
      .eq("space_id", space.id)
      .is("answer", null)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("promises")
      .select("*")
      .eq("space_id", space.id)
      .eq("status", "pending")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(4),
    Promise.all([
      supabase
        .from("memories")
        .select("id", { count: "exact", head: true })
        .eq("space_id", space.id),
      supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("space_id", space.id)
        .not("answer", "is", null),
      supabase
        .from("promises")
        .select("id", { count: "exact", head: true })
        .eq("space_id", space.id)
        .eq("status", "kept"),
      supabase
        .from("dates")
        .select("id", { count: "exact", head: true })
        .eq("space_id", space.id)
        .eq("status", "done"),
    ]),
  ]);

  const firstImages = (memories.data ?? [])
    .map((m) => m.memory_media?.find((mm) => mm.media_type === "image"))
    .filter((mm): mm is NonNullable<typeof mm> => Boolean(mm))
    .map((mm) => mm.storage_path);
  const signed = await signPaths("memories", firstImages);

  const [memCount, ralliesCount, keptCount, playedCount] = counts;

  return (
    <div>
      <FadeIn>
        <p className="text-sm text-muted-foreground">{space.name}</p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          Hola, {me.display_name || "campeón/a"}
          {partner ? (
            <span className="text-muted-foreground">
              {" "}
              · al otro lado de la red: {partner.display_name}
            </span>
          ) : null}
        </h1>
      </FadeIn>

      {featured ? (
        <FadeIn delay={0.05} className="mt-6">
          <EventHero
            event={featured}
            todayDays={heroToday}
            nextDay={heroNext}
            todayStr={todayStr}
            progress={heroProgress}
          />
        </FadeIn>
      ) : null}

      <FadeIn delay={0.08} className="mt-6">
        <Scoreboard
          items={[
            { label: "Highlights", count: memCount.count ?? 0 },
            { label: "Rallies", count: ralliesCount.count ?? 0 },
            { label: "Promesas", count: keptCount.count ?? 0 },
            { label: "Partidos", count: playedCount.count ?? 0 },
          ]}
        />
        {!partner ? (
          <p className="mt-3 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
            Tu pareja aún no entra a la pista. Cuando inicie sesión con su
            cuenta, ocupará el otro lado de la red automáticamente. 🎾
          </p>
        ) : null}
      </FadeIn>

      <StaggerList className="mt-8 grid gap-6 md:grid-cols-2">
        <StaggerItem>
          <SectionCard
            title="Próximos partidos"
            href="/citas"
            icon={<CalendarHeart className="size-4" aria-hidden />}
          >
            {dates.data && dates.data.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {dates.data.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{d.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(d.scheduled_at), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                        {d.location ? ` · ${d.location}` : ""}
                      </p>
                    </div>
                    <Badge variant="secondary">Programado</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Sin partidos agendados"
                hint="Agenda la próxima cita y que no se pase el turno de saque."
                className="py-8"
              />
            )}
          </SectionCard>
        </StaggerItem>

        <StaggerItem>
          <SectionCard
            title="Rallies por responder"
            href="/rallies"
            icon={<MessagesSquare className="size-4" aria-hidden />}
          >
            {questions.data && questions.data.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {questions.data.map((q) => (
                  <li key={q.id}>
                    <p className="font-medium">“{q.body}”</p>
                    <p className="text-sm text-muted-foreground">
                      La pelota está en {q.author_id === me.id ? "su" : "tu"} lado.
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No hay peloteo pendiente"
                hint="Lanza una pregunta y empieza el rally."
                className="py-8"
              />
            )}
          </SectionCard>
        </StaggerItem>

        <StaggerItem>
          <SectionCard
            title="Match Points activos"
            href="/match-points"
            icon={<Medal className="size-4" aria-hidden />}
          >
            {promises.data && promises.data.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {promises.data.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3">
                    <p className="font-medium">{p.body}</p>
                    {p.due_date ? (
                      <Badge variant="outline">
                        {format(new Date(`${p.due_date}T00:00:00`), "d MMM", { locale: es })}
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Sin promesas activas"
                hint="Un match point es una promesa con fecha. ¿Se atreven?"
                className="py-8"
              />
            )}
          </SectionCard>
        </StaggerItem>

        <StaggerItem>
          <SectionCard
            title="Últimos highlights"
            href="/highlights"
            icon={<Sparkles className="size-4" aria-hidden />}
          >
            {memories.data && memories.data.length > 0 ? (
              <ul className="grid grid-cols-2 gap-3">
                {memories.data.map((m) => {
                  const img = m.memory_media?.find((mm) => mm.media_type === "image");
                  const url = img ? signed.get(img.storage_path) : null;
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/highlights/${m.id}`}
                        className="group block overflow-hidden rounded-xl border"
                      >
                        {url ? (
                          // Signed URL temporal: <img> simple, sin optimizador.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={url}
                            alt=""
                            loading="lazy"
                            className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="court-texture flex aspect-[4/3] w-full items-center justify-center bg-secondary text-3xl">
                            🎾
                          </div>
                        )}
                        <p className="truncate px-3 py-2 text-sm font-medium">
                          {m.title}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                title="Aún no hay highlights"
                hint="Guarda el primer recuerdo de la temporada."
                className="py-8"
              />
            )}
          </SectionCard>
        </StaggerItem>
      </StaggerList>
    </div>
  );
}

function SectionCard({
  title,
  href,
  icon,
  children,
}: {
  title: string;
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 font-display text-lg font-normal">
          {icon}
          {title}
        </CardTitle>
        <Link
          href={href}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Ver todo
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
