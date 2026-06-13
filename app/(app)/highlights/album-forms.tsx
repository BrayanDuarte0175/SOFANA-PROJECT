"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderPlus, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { createAlbum, updateAlbum, deleteAlbum } from "@/lib/actions/albums";
import type { Album } from "@/lib/database.types";
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

function AlbumForm({
  album,
  onDone,
}: {
  album?: Album;
  onDone: (id?: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const payload = {
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
    };
    startTransition(async () => {
      const r = album
        ? await updateAlbum(album.id, payload)
        : await createAlbum(payload);
      if ("error" in r && r.error) {
        toast.error(r.error);
      } else {
        toast.success(album ? "Álbum actualizado" : "¡Álbum creado! 📸");
        onDone("id" in r ? (r.id as string) : undefined);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="album-title">Nombre del álbum *</Label>
        <Input
          id="album-title"
          name="title"
          required
          maxLength={140}
          defaultValue={album?.title ?? ""}
          placeholder="Verano 2026, Aniversario…"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="album-desc">Descripción</Label>
        <Textarea
          id="album-desc"
          name="description"
          rows={2}
          defaultValue={album?.description ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {album ? "Guardar cambios" : "Crear álbum"}
      </Button>
    </form>
  );
}

export function NewAlbumDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderPlus className="size-4" aria-hidden />
          Crear álbum
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Nuevo álbum</DialogTitle>
          <DialogDescription>
            Agrupa highlights y, si quieres, enlázalo a un viaje del Tour.
          </DialogDescription>
        </DialogHeader>
        <AlbumForm
          onDone={(id) => {
            setOpen(false);
            if (id) router.push(`/highlights/album/${id}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function AlbumActions({ album }: { album: Album }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Opciones del álbum">
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
                Borrar álbum
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Borrar este álbum?</AlertDialogTitle>
                <AlertDialogDescription>
                  Los highlights y viajes NO se borran: solo se desvinculan
                  del álbum.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    const r = await deleteAlbum(album.id);
                    if (r.error) toast.error(r.error);
                    else {
                      router.push("/highlights");
                      router.refresh();
                    }
                  }}
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
            <DialogTitle className="font-display">Editar álbum</DialogTitle>
          </DialogHeader>
          <AlbumForm
            album={album}
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
