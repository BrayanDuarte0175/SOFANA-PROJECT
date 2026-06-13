"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Check,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import {
  createDate,
  updateDate,
  setDateStatus,
  deleteDate,
} from "@/lib/actions/dates";
import type { DateRow } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function DateForm({
  date,
  onDone,
}: {
  date?: DateRow;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      title: String(data.get("title") ?? ""),
      scheduled_at: String(data.get("scheduled_at") ?? ""),
      location: String(data.get("location") ?? ""),
      notes: String(data.get("notes") ?? ""),
    };
    startTransition(async () => {
      const r = date
        ? await updateDate(date.id, payload)
        : await createDate(payload);
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success(date ? "Partido actualizado" : "¡Partido agendado! 🎾");
        onDone();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="date-title">Título *</Label>
        <Input
          id="date-title"
          name="title"
          required
          maxLength={120}
          defaultValue={date?.title ?? ""}
          placeholder="Cena en nuestro lugar de siempre"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="date-when">Fecha y hora *</Label>
        <Input
          id="date-when"
          name="scheduled_at"
          type="datetime-local"
          required
          defaultValue={
            date ? format(new Date(date.scheduled_at), "yyyy-MM-dd'T'HH:mm") : ""
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="date-loc">Lugar</Label>
        <Input
          id="date-loc"
          name="location"
          maxLength={120}
          defaultValue={date?.location ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="date-notes">Notas</Label>
        <Textarea
          id="date-notes"
          name="notes"
          rows={2}
          defaultValue={date?.notes ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {date ? "Guardar cambios" : "Agendar partido"}
      </Button>
    </form>
  );
}

export function DateDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden />
          Agendar partido
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Nuevo partido</DialogTitle>
        </DialogHeader>
        <DateForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function DateActions({ date }: { date: DateRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ error?: string }>, ok?: string) =>
    startTransition(async () => {
      const r = await fn();
      if (r.error) toast.error(r.error);
      else if (ok) toast.success(ok);
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Opciones de la cita" disabled={pending}>
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {date.status === "scheduled" ? (
            <DropdownMenuItem
              onClick={() => run(() => setDateStatus(date.id, "done"), "Partido jugado ✔")}
            >
              <Check className="size-4" aria-hidden />
              Marcar como jugado
            </DropdownMenuItem>
          ) : null}
          {date.status === "scheduled" ? (
            <DropdownMenuItem
              onClick={() => run(() => setDateStatus(date.id, "cancelled"))}
            >
              <XCircle className="size-4" aria-hidden />
              Suspender
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => run(() => setDateStatus(date.id, "scheduled"))}
            >
              <Check className="size-4" aria-hidden />
              Reprogramar como pendiente
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" aria-hidden />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => run(() => deleteDate(date.id))}
          >
            <Trash2 className="size-4" aria-hidden />
            Borrar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Editar partido</DialogTitle>
          </DialogHeader>
          <DateForm date={date} onDone={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
