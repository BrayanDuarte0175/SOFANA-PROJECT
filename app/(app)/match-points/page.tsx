import type { Metadata } from "next";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/tennis/empty-state";
import { StaggerList, StaggerItem } from "@/components/motion/fade-in";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourtLine } from "@/components/tennis/court-line";
import { NewPromiseForm, PromiseActions } from "./promise-forms";

export const metadata: Metadata = { title: "Match Points" };

export default async function MatchPointsPage() {
  const { space, me, partner } = await getSpaceContext();
  const supabase = await createClient();

  const { data: promises } = await supabase
    .from("promises")
    .select("*")
    .eq("space_id", space.id)
    .order("created_at", { ascending: false });

  const profiles = [me, ...(partner ? [partner] : [])];
  const nameOf = (id: string) =>
    profiles.find((p) => p.id === id)?.display_name ?? "—";

  const active = (promises ?? []).filter((p) => p.status === "pending");
  const history = (promises ?? []).filter((p) => p.status !== "pending");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Match Points"
        subtitle="Promesas con fecha: puntos que se juegan en serio."
      />

      <NewPromiseForm />

      <h2 className="mt-8 font-display text-xl">En juego</h2>
      {active.length === 0 ? (
        <EmptyState
          title="No hay match points en juego"
          hint="Promete algo bonito y ponle fecha."
          className="mt-3"
        />
      ) : (
        <StaggerList className="mt-3 flex flex-col gap-3">
          {active.map((p) => (
            <StaggerItem key={p.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 pt-6">
                  <div>
                    <p className="font-medium">{p.body}</p>
                    <p className="text-sm text-muted-foreground">
                      Promesa de {nameOf(p.author_id)}
                      {p.due_date
                        ? ` · para el ${format(new Date(`${p.due_date}T00:00:00`), "d 'de' MMMM yyyy", { locale: es })}`
                        : ""}
                    </p>
                  </div>
                  <PromiseActions id={p.id} status={p.status} />
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      {history.length > 0 ? (
        <>
          <CourtLine />
          <h2 className="font-display text-xl">Historial</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {history.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
              >
                <div>
                  <p className={p.status === "kept" ? "" : "line-through opacity-70"}>
                    {p.body}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nameOf(p.author_id)}
                    {p.completed_at
                      ? ` · ${format(new Date(p.completed_at), "d MMM yyyy", { locale: es })}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {p.status === "kept" ? (
                    <Badge className="bg-ball text-ball-foreground hover:bg-ball">
                      Cumplida 🏆
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-clay text-clay">
                      No cumplida
                    </Badge>
                  )}
                  <PromiseActions id={p.id} status={p.status} compact />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
