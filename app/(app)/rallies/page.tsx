import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/tennis/empty-state";
import { StaggerList, StaggerItem } from "@/components/motion/fade-in";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MAX_ANSWER_EDITS } from "@/lib/rallies";
import {
  AskQuestionForm,
  AnswerForm,
  EditAnswerForm,
  DeleteQuestionButton,
} from "./rally-forms";

export const metadata: Metadata = { title: "Rallies" };

export default async function RalliesPage() {
  const { space, me, partner, userId } = await getSpaceContext();
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("space_id", space.id)
    .order("created_at", { ascending: false });

  const profiles = [me, ...(partner ? [partner] : [])];
  const nameOf = (id: string | null) =>
    profiles.find((p) => p.id === id)?.display_name ?? "—";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Rallies"
        subtitle="Uno saca con una pregunta, el otro devuelve con su respuesta."
      />

      <AskQuestionForm />

      {!questions || questions.length === 0 ? (
        <EmptyState
          title="Nadie ha sacado todavía"
          hint="Escribe la primera pregunta y empieza el peloteo."
          className="mt-6"
        />
      ) : (
        <StaggerList className="mt-6 flex flex-col gap-4">
          {questions.map((q) => {
            const mine = q.author_id === userId;
            const answered = q.answer !== null;
            const iAnswered = q.answered_by === userId;
            const editsLeft = MAX_ANSWER_EDITS - q.answer_edit_count;
            return (
              <StaggerItem key={q.id}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">
                          Saque de {nameOf(q.author_id)} ·{" "}
                          {formatDistanceToNow(new Date(q.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                        <p className="mt-1 font-display text-lg leading-snug">
                          {q.body}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {answered ? (
                          <Badge variant="secondary">Punto jugado</Badge>
                        ) : (
                          <Badge className="bg-ball text-ball-foreground hover:bg-ball">
                            En el aire
                          </Badge>
                        )}
                        {mine ? <DeleteQuestionButton id={q.id} /> : null}
                      </div>
                    </div>

                    {answered ? (
                      <div className="mt-4 rounded-xl bg-muted px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                          Devolución de {nameOf(q.answered_by)}
                          {q.answered_at
                            ? ` · ${formatDistanceToNow(new Date(q.answered_at), { addSuffix: true, locale: es })}`
                            : ""}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{q.answer}</p>
                        {iAnswered ? (
                          <EditAnswerForm
                            questionId={q.id}
                            current={q.answer ?? ""}
                            editsLeft={editsLeft}
                          />
                        ) : null}
                      </div>
                    ) : mine ? (
                      <p className="mt-4 text-sm text-muted-foreground">
                        La pelota está en su lado de la red…
                      </p>
                    ) : (
                      <AnswerForm questionId={q.id} />
                    )}
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}
    </div>
  );
}
