"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { createEvent, updateEvent, deleteEvent } from "@/lib/actions/events";
import { ACCENT_OPTIONS } from "@/lib/events";
import type { EventAccent, EventRow } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

function AccentPicker({
  value,
  onChange,
}: {
  value: EventAccent;
  onChange: (v: EventAccent) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
      {ACCENT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          aria-label={opt.label}
          onClick={() => onChange(opt.value)}
          className={cn(
            "size-7 rounded-full ring-offset-2 ring-offset-background transition",
            opt.dot,
            value === opt.value ? "ring-2 ring-foreground" : "opacity-70",
          )}
        />
      ))}
    </div>
  );
}

function EventForm({
  event,
  onDone,
}: {
  event?: EventRow;
  onDone: (id?: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [accent, setAccent] = useState<EventAccent>(event?.accent ?? "court");
  const [shared, setShared] = useState<boolean>(event?.is_shared ?? false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const payload = {
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      start_date: String(data.get("start_date") ?? ""),
      end_date: String(data.get("end_date") ?? ""),
      emoji: String(data.get("emoji") ?? ""),
      accent,
      is_shared: shared,
    };
    startTransition(async () => {
      const r = event
        ? await updateEvent(event.id, payload)
        : await createEvent(payload);
      if ("error" in r && r.error) {
        toast.error(r.error);
      } else {
        toast.success(event ? "Torneo actualizado" : "¡Torneo creado! 🏆");
        onDone("id" in r ? (r.id as string) : undefined);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ev-title">Nombre del torneo *</Label>
          <Input
            id="ev-title"
            name="title"
            required
            maxLength={140}
            defaultValue={event?.title ?? ""}
            placeholder="30 días contigo"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ev-emoji">Emoji</Label>
          <Input
            id="ev-emoji"
            name="emoji"
            maxLength={8}
            defaultValue={event?.emoji ?? ""}
            placeholder="🏆"
            className="w-16 text-center"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ev-desc">Descripción</Label>
        <Textarea
          id="ev-desc"
          name="description"
          rows={2}
          defaultValue={event?.description ?? ""}
          placeholder="La idea es vernos mínimo 3 días este mes; el resto son sorpresas…"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ev-start">Inicio *</Label>
          <Input
            id="ev-start"
            name="start_date"
            type="date"
            required
            defaultValue={event?.start_date ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ev-end">Fin *</Label>
          <Input
            id="ev-end"
            name="end_date"
            type="date"
            required
            defaultValue={event?.end_date ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Color del torneo</Label>
        <AccentPicker value={accent} onChange={setAccent} />
      </div>

      <label className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
        <span>
          <span className="font-medium">Torneo compartido 🤝</span>
          <span className="block text-xs text-muted-foreground">
            Es un evento donde los dos pueden participar: ambos agregan,
            editan y eliminan jornadas sin restricciones. Si lo dejas
            apagado, solo tú podrás agregar jornadas (cada quien edita las
            suyas).
          </span>
        </span>
        <Switch checked={shared} onCheckedChange={setShared} />
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {event ? "Guardar cambios" : "Crear torneo"}
      </Button>
    </form>
  );
}

export function NewEventDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden />
          Nuevo torneo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Nuevo torneo</DialogTitle>
          <DialogDescription>
            Un evento de varios días. Luego añades una jornada por cada día.
          </DialogDescription>
        </DialogHeader>
        <EventForm
          onDone={(id) => {
            setOpen(false);
            if (id) router.push(`/torneos/${id}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EventActions({ event }: { event: EventRow }) {
  const router = useRouter();
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
          <Button variant="ghost" size="icon" aria-label="Opciones del torneo" disabled={pending}>
            <MoreHorizontal className="size-5" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" aria-hidden />
            Editar
          </DropdownMenuItem>
          {event.status === "active" ? (
            <DropdownMenuItem
              onClick={() => run(() => updateEvent(event.id, { status: "archived" }), "Torneo archivado")}
            >
              <Archive className="size-4" aria-hidden />
              Archivar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => run(() => updateEvent(event.id, { status: "active" }), "Torneo reactivado")}
            >
              <ArchiveRestore className="size-4" aria-hidden />
              Reactivar
            </DropdownMenuItem>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
                <Trash2 className="size-4" aria-hidden />
                Borrar torneo
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Borrar este torneo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borran todas sus jornadas. No se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    startTransition(async () => {
                      const r = await deleteEvent(event.id);
                      if (r.error) toast.error(r.error);
                      else {
                        router.push("/torneos");
                        router.refresh();
                      }
                    })
                  }
                >
                  Borrar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Editar torneo</DialogTitle>
          </DialogHeader>
          <EventForm
            event={event}
            onDone={() => {
              setEditOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
