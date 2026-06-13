"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  updateMemory,
  deleteMemory,
  addMemoryMedia,
} from "@/lib/actions/memories";
import { uploadMedia } from "@/lib/upload";
import type { Memory } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

export function MemoryActions({
  memory,
  spaceId,
  albums,
}: {
  memory: Memory;
  spaceId: string;
  albums: AlbumOption[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [albumId, setAlbumId] = useState<string | null>(memory.album_id);

  async function handleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const files = (data.getAll("media") as File[]).filter((f) => f.size > 0);

    setBusy(true);
    try {
      if (files.length > 0) {
        const { uploaded, errors } = await uploadMedia("memories", spaceId, files);
        errors.forEach((e) => toast.error(e));
        if (uploaded.length > 0) {
          const r = await addMemoryMedia(memory.id, uploaded);
          if (r.error) toast.error(r.error);
        }
      }

      const r = await updateMemory(memory.id, {
        title: String(data.get("title") ?? memory.title),
        description: String(data.get("description") ?? "") || null,
        event_date: String(data.get("event_date") ?? "") || null,
        location: String(data.get("location") ?? "") || null,
        album_id: albumId,
      });
      if (r.error) {
        toast.error(r.error);
      } else {
        setEditOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const r = await deleteMemory(memory.id);
    if (r.error) {
      toast.error(r.error);
    } else {
      router.push("/highlights");
      router.refresh();
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Opciones del highlight">
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
                Borrar highlight
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Borrar este highlight?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borran también sus fotos y videos. No hay repetición
                  instantánea: esto no se puede deshacer.
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

      <Dialog open={editOpen} onOpenChange={(v) => !busy && setEditOpen(v)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Editar highlight</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="em-title">Título *</Label>
              <Input
                id="em-title"
                name="title"
                required
                maxLength={120}
                defaultValue={memory.title}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="em-desc">Descripción</Label>
              <Textarea
                id="em-desc"
                name="description"
                rows={3}
                defaultValue={memory.description ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="em-date">Fecha</Label>
                <Input
                  id="em-date"
                  name="event_date"
                  type="date"
                  defaultValue={memory.event_date ?? ""}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="em-loc">Lugar</Label>
                <Input
                  id="em-loc"
                  name="location"
                  maxLength={120}
                  defaultValue={memory.location ?? ""}
                />
              </div>
            </div>
            {albums.length > 0 ? (
              <AlbumSelect
                id="em-album"
                albums={albums}
                value={albumId}
                onChange={setAlbumId}
              />
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="em-media">Añadir fotos o videos</Label>
              <Input
                id="em-media"
                name="media"
                type="file"
                multiple
                accept="image/*,video/mp4,video/quicktime,video/webm"
              />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Guardando…
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
