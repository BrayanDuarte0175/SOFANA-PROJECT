"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, Plus, RotateCcw, Trash2, Trophy, X } from "lucide-react";
import {
  createPromise,
  setPromiseStatus,
  deletePromise,
} from "@/lib/actions/promises";
import type { PromiseStatus } from "@/lib/database.types";
import { usePointWon } from "@/components/tennis/point-won";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NewPromiseForm() {
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      action={() => {
        const body = bodyRef.current?.value ?? "";
        if (!body.trim()) return;
        startTransition(async () => {
          const r = await createPromise(body, dateRef.current?.value || undefined);
          if (r.error) {
            toast.error(r.error);
          } else {
            if (bodyRef.current) bodyRef.current.value = "";
            if (dateRef.current) dateRef.current.value = "";
            toast.success("Match point sobre la mesa 🎾");
          }
        });
      }}
    >
      <label htmlFor="promise-body" className="sr-only">
        Nueva promesa
      </label>
      <Input
        id="promise-body"
        ref={bodyRef}
        maxLength={300}
        placeholder="Prometo que…"
        disabled={pending}
        className="flex-1"
      />
      <label htmlFor="promise-date" className="sr-only">
        Fecha límite
      </label>
      <Input
        id="promise-date"
        ref={dateRef}
        type="date"
        disabled={pending}
        className="sm:w-44"
      />
      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Plus className="size-4" aria-hidden />
        )}
        Prometer
      </Button>
    </form>
  );
}

export function PromiseActions({
  id,
  status,
  compact = false,
}: {
  id: string;
  status: PromiseStatus;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const { celebrate, node } = usePointWon();

  const run = (fn: () => Promise<{ error?: string }>, onOk?: () => void) =>
    startTransition(async () => {
      const r = await fn();
      if (r.error) toast.error(r.error);
      else onOk?.();
    });

  return (
    <>
      {node}
      {!compact && status === "pending" ? (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(
                () => setPromiseStatus(id, "kept"),
                () => celebrate("¡Match point ganado! 🏆"),
              )
            }
          >
            <Trophy className="size-4" aria-hidden />
            ¡Cumplida!
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Más opciones" disabled={pending}>
                <MoreHorizontal className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => run(() => setPromiseStatus(id, "broken"))}>
                <X className="size-4" aria-hidden />
                Marcar no cumplida
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => run(() => deletePromise(id))}
              >
                <Trash2 className="size-4" aria-hidden />
                Borrar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Opciones" disabled={pending}>
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => run(() => setPromiseStatus(id, "pending"))}>
              <RotateCcw className="size-4" aria-hidden />
              Reabrir
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => run(() => deletePromise(id))}
            >
              <Trash2 className="size-4" aria-hidden />
              Borrar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
