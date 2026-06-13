"use client";

import { useRef, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Send } from "lucide-react";
import { addComment, deleteComment } from "@/lib/actions/social";
import type { Comment, CommentTarget, Profile } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CommentsSection({
  targetType,
  targetId,
  comments,
  profiles,
}: {
  targetType: CommentTarget;
  targetId: string;
  comments: Comment[];
  profiles: Profile[];
}) {
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const nameOf = (id: string) =>
    profiles.find((p) => p.id === id)?.display_name ?? "—";

  return (
    <section aria-label="Comentarios" className="flex flex-col gap-4">
      <h3 className="font-display text-lg">Comentarios al pie de pista</h3>
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nadie ha comentado este punto todavía.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="group flex items-start justify-between gap-2 rounded-xl bg-muted px-3 py-2">
              <div>
                <p className="text-sm">
                  <span className="font-medium">{nameOf(c.author_id)}</span>{" "}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </p>
                <p className="text-sm">{c.body}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Borrar comentario"
                className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() =>
                  startTransition(() => {
                    deleteComment(c.id);
                  })
                }
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex gap-2"
        action={() => {
          const value = inputRef.current?.value ?? "";
          if (!value.trim()) return;
          startTransition(async () => {
            await addComment(targetType, targetId, value);
            if (inputRef.current) inputRef.current.value = "";
          });
        }}
      >
        <Input
          ref={inputRef}
          name="body"
          placeholder="Escribe un comentario…"
          aria-label="Nuevo comentario"
          disabled={pending}
        />
        <Button type="submit" size="icon" disabled={pending} aria-label="Enviar">
          <Send className="size-4" aria-hidden />
        </Button>
      </form>
      <span className="sr-only" aria-live="polite">
        {pending ? "Enviando…" : ""}
      </span>
    </section>
  );
}
