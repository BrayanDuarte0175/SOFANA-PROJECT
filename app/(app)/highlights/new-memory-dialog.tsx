"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { uploadMedia } from "@/lib/upload";
import { createMemory } from "@/lib/actions/memories";
import { usePointWon } from "@/components/tennis/point-won";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlbumSelect, type AlbumOption } from "@/components/app/album-select";

export function NewMemoryDialog({
  spaceId,
  albums,
  defaultAlbumId = null,
}: {
  spaceId: string;
  albums: AlbumOption[];
  defaultAlbumId?: string | null;
}) {
  const router = useRouter();
  const { celebrate, node } = usePointWon();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [albumId, setAlbumId] = useState<string | null>(defaultAlbumId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const files = (data.getAll("media") as File[]).filter((f) => f.size > 0);

    setBusy(true);
    try {
      let media: { path: string; type: "image" | "video" }[] = [];
      if (files.length > 0) {
        setProgress(`Subiendo 0/${files.length}…`);
        const { uploaded, errors } = await uploadMedia(
          "memories",
          spaceId,
          files,
          (done, total) => setProgress(`Subiendo ${done}/${total}…`),
        );
        errors.forEach((e) => toast.error(e));
        media = uploaded;
        if (uploaded.length === 0 && files.length > 0) {
          setBusy(false);
          setProgress(null);
          return;
        }
      }

      const result = await createMemory({
        title: String(data.get("title") ?? ""),
        description: String(data.get("description") ?? ""),
        event_date: String(data.get("event_date") ?? ""),
        location: String(data.get("location") ?? ""),
        album_id: albumId,
        media,
      });

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        setOpen(false);
        celebrate("¡Highlight guardado!");
        router.refresh();
      }
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <>
      {node}
      <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="size-4" aria-hidden />
            Nuevo highlight
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Nuevo highlight</DialogTitle>
            <DialogDescription>
              Un punto para el recuerdo: fotos, videos y la historia detrás.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="hl-title">Título *</Label>
              <Input id="hl-title" name="title" required maxLength={120} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hl-desc">Descripción</Label>
              <Textarea id="hl-desc" name="description" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="hl-date">Fecha</Label>
                <Input id="hl-date" name="event_date" type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="hl-loc">Lugar</Label>
                <Input id="hl-loc" name="location" maxLength={120} />
              </div>
            </div>
            {albums.length > 0 ? (
              <AlbumSelect
                id="hl-album"
                albums={albums}
                value={albumId}
                onChange={setAlbumId}
              />
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="hl-media">Fotos y videos</Label>
              <Input
                id="hl-media"
                name="media"
                type="file"
                multiple
                accept="image/*,video/mp4,video/quicktime,video/webm"
              />
              <p className="text-xs text-muted-foreground">
                Hasta 50 MB por archivo. Se guardan en privado: solo ustedes
                dos pueden verlos.
              </p>
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {progress ?? "Guardando…"}
                </>
              ) : (
                "Guardar highlight"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
