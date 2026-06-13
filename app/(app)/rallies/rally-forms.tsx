"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Send, Trash2 } from "lucide-react";
import { askQuestion, answerQuestion, deleteQuestion } from "@/lib/actions/questions";
import { usePointWon } from "@/components/tennis/point-won";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AskQuestionForm() {
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <form
      className="flex flex-col gap-2"
      action={() => {
        const body = ref.current?.value ?? "";
        if (!body.trim()) return;
        startTransition(async () => {
          const r = await askQuestion(body);
          if (r.error) {
            toast.error(r.error);
          } else if (ref.current) {
            ref.current.value = "";
            toast.success("¡Saque lanzado! 🎾");
          }
        });
      }}
    >
      <label htmlFor="new-question" className="sr-only">
        Nueva pregunta
      </label>
      <Textarea
        id="new-question"
        ref={ref}
        rows={2}
        maxLength={500}
        placeholder="Lanza una pregunta… (ej. ¿cuál fue tu momento favorito del mes?)"
        disabled={pending}
      />
      <Button type="submit" disabled={pending} className="self-end">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Send className="size-4" aria-hidden />
        )}
        Sacar
      </Button>
    </form>
  );
}

export function AnswerForm({ questionId }: { questionId: string }) {
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);
  const { celebrate, node } = usePointWon();

  return (
    <form
      className="mt-4 flex flex-col gap-2"
      action={() => {
        const answer = ref.current?.value ?? "";
        if (!answer.trim()) return;
        startTransition(async () => {
          const r = await answerQuestion(questionId, answer);
          if (r.error) toast.error(r.error);
          else celebrate("¡Gran devolución!");
        });
      }}
    >
      {node}
      <label htmlFor={`answer-${questionId}`} className="sr-only">
        Tu respuesta
      </label>
      <Textarea
        id={`answer-${questionId}`}
        ref={ref}
        rows={2}
        maxLength={1000}
        placeholder="Tu devolución…"
        disabled={pending}
      />
      <Button
        type="submit"
        variant="secondary"
        disabled={pending}
        className="self-end"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : null}
        Responder
      </Button>
    </form>
  );
}

export function EditAnswerForm({
  questionId,
  current,
  editsLeft,
}: {
  questionId: string;
  current: string;
  editsLeft: number;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  if (editsLeft <= 0) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        Respuesta fijada (usaste tus 3 ediciones).
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Pencil className="size-3.5" aria-hidden />
        Editar respuesta ({editsLeft}{" "}
        {editsLeft === 1 ? "edición" : "ediciones"} restantes)
      </button>
    );
  }

  return (
    <form
      className="mt-3 flex flex-col gap-2"
      action={() => {
        const value = ref.current?.value ?? "";
        if (!value.trim()) return;
        startTransition(async () => {
          const r = await answerQuestion(questionId, value);
          if (r.error) toast.error(r.error);
          else {
            toast.success("Respuesta actualizada");
            setOpen(false);
          }
        });
      }}
    >
      <Textarea
        ref={ref}
        rows={2}
        maxLength={1000}
        defaultValue={current}
        disabled={pending}
        aria-label="Editar respuesta"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Guardar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
        <span className="text-xs text-muted-foreground">
          Te quedan {editsLeft} {editsLeft === 1 ? "edición" : "ediciones"}.
        </span>
      </div>
    </form>
  );
}

export function DeleteQuestionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Borrar rally"
          disabled={pending}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Borrar este rally?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borra la pregunta y su respuesta. No se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                const r = await deleteQuestion(id);
                if (r.error) toast.error(r.error);
              })
            }
          >
            Borrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
