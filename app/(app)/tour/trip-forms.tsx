"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { createTrip, updateTrip, deleteTrip } from "@/lib/actions/trips";
import type { Trip } from "@/lib/database.types";
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
import { AlbumSelect, type AlbumOption } from "@/components/app/album-select";

function TripForm({
  trip,
  albums,
  onDone,
}: {
  trip?: Trip;
  albums: AlbumOption[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [albumId, setAlbumId] = useState<string | null>(trip?.album_id ?? null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      title: String(data.get("title") ?? ""),
      destination: String(data.get("destination") ?? ""),
      start_date: String(data.get("start_date") ?? "") || null,
      end_date: String(data.get("end_date") ?? "") || null,
      notes: String(data.get("notes") ?? "") || null,
      album_id: albumId,
    };
    startTransition(async () => {
      const r = trip
        ? await updateTrip(trip.id, payload)
        : await createTrip({
            ...payload,
            start_date: payload.start_date ?? undefined,
            end_date: payload.end_date ?? undefined,
            notes: payload.notes ?? undefined,
          });
      if ("error" in r && r.error) {
        toast.error(r.error);
      } else {
        toast.success(trip ? "Gira actualizada" : "¡Nueva gira en el Tour! ✈️");
        onDone();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="trip-title">Título *</Label>
        <Input
          id="trip-title"
          name="title"
          required
          maxLength={120}
          defaultValue={trip?.title ?? ""}
          placeholder="Roland Garros de aniversario"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="trip-dest">Destino *</Label>
        <Input
          id="trip-dest"
          name="destination"
          required
          maxLength={120}
          defaultValue={trip?.destination ?? ""}
          placeholder="París, Francia"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="trip-start">Inicio</Label>
          <Input
            id="trip-start"
            name="start_date"
            type="date"
            defaultValue={trip?.start_date ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="trip-end">Fin</Label>
          <Input
            id="trip-end"
            name="end_date"
            type="date"
            defaultValue={trip?.end_date ?? ""}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="trip-notes">Notas</Label>
        <Textarea
          id="trip-notes"
          name="notes"
          rows={3}
          defaultValue={trip?.notes ?? ""}
        />
      </div>
      {albums.length > 0 ? (
        <div className="flex flex-col gap-1">
          <AlbumSelect
            id="trip-album"
            albums={albums}
            value={albumId}
            onChange={setAlbumId}
            label="Álbum de fotos del viaje"
          />
          <p className="text-xs text-muted-foreground">
            Enlaza un álbum para asociar sus fotos a este viaje.
          </p>
        </div>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {trip ? "Guardar cambios" : "Crear gira"}
      </Button>
    </form>
  );
}

export function NewTripDialog({ albums }: { albums: AlbumOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden />
          Nueva gira
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Nueva gira</DialogTitle>
        </DialogHeader>
        <TripForm albums={albums} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function TripActions({
  trip,
  albums,
}: {
  trip: Trip;
  albums: AlbumOption[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    const r = await deleteTrip(trip.id);
    if (r.error) {
      toast.error(r.error);
    } else {
      router.push("/tour");
      router.refresh();
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Opciones del viaje">
            <MoreHorizontal className="size-5" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" aria-hidden />
            Editar
          </DropdownMenuItem>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => e.preventDefault()}
              >
                <Trash2 className="size-4" aria-hidden />
                Borrar gira
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Borrar esta gira?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se pierde el plan y su checklist. No se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
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
            <DialogTitle className="font-display">Editar gira</DialogTitle>
          </DialogHeader>
          <TripForm
            trip={trip}
            albums={albums}
            onDone={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
