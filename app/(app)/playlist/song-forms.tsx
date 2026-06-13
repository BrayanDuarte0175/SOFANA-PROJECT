"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, Loader2, Plus, Upload } from "lucide-react";
import { addSongLink, addSongUpload } from "@/lib/actions/songs";
import { uploadAudio } from "@/lib/upload";
import { parseMusicLink } from "@/lib/music";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AddSongDialog({ spaceId }: { spaceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  async function handleLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const url = String(data.get("url") ?? "");

    if (!parseMusicLink(url)) {
      toast.error("Pega un enlace válido de Spotify o YouTube / YouTube Music.");
      return;
    }

    setBusy(true);
    try {
      const r = await addSongLink({
        url,
        title: String(data.get("title") ?? ""),
        artist: String(data.get("artist") ?? ""),
        note: String(data.get("note") ?? ""),
      });
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("¡Canción añadida a la playlist! 🎵");
        setOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const file = data.get("file") as File | null;
    const title = String(data.get("title") ?? "");

    if (!file || file.size === 0) {
      toast.error("Elige un archivo de audio.");
      return;
    }
    if (!title.trim()) {
      toast.error("Ponle un título a la canción.");
      return;
    }

    setBusy(true);
    try {
      setProgress("Subiendo audio…");
      const up = await uploadAudio(spaceId, file);
      if (up.error || !up.path) {
        toast.error(up.error ?? "No se pudo subir el audio.");
        return;
      }
      const r = await addSongUpload({
        path: up.path,
        title,
        artist: String(data.get("artist") ?? ""),
        note: String(data.get("note") ?? ""),
      });
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success("¡Canción subida a la playlist! 🎵");
        setOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden />
          Añadir canción
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Añadir a la playlist</DialogTitle>
          <DialogDescription>
            Pega un enlace para escucharlo dentro de la app, o sube tu propio
            archivo de audio.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">
              <Link2 className="size-4" aria-hidden />
              Enlace
            </TabsTrigger>
            <TabsTrigger value="file">
              <Upload className="size-4" aria-hidden />
              Archivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link">
            <form onSubmit={handleLink} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="song-url">Enlace de Spotify o YouTube *</Label>
                <Input
                  id="song-url"
                  name="url"
                  required
                  inputMode="url"
                  placeholder="https://open.spotify.com/track/…  ·  https://music.youtube.com/…"
                />
                <p className="text-xs text-muted-foreground">
                  Funciona con canciones, álbumes o playlists de Spotify y con
                  videos/listas de YouTube y YouTube Music.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="song-link-title">Título</Label>
                  <Input
                    id="song-link-title"
                    name="title"
                    maxLength={200}
                    placeholder="Se detecta solo"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="song-link-artist">Artista</Label>
                  <Input id="song-link-artist" name="artist" maxLength={160} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="song-link-note">Dedicatoria / nota</Label>
                <Input
                  id="song-link-note"
                  name="note"
                  maxLength={300}
                  placeholder="Nuestra canción de aquella noche…"
                />
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Añadiendo…
                  </>
                ) : (
                  "Añadir enlace"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="file">
            <form onSubmit={handleUpload} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="song-file">Archivo de audio *</Label>
                <Input
                  id="song-file"
                  name="file"
                  type="file"
                  required
                  accept="audio/*"
                />
                <p className="text-xs text-muted-foreground">
                  MP3, M4A, WAV, OGG o FLAC. Hasta 100 MB. Se guarda en privado:
                  solo ustedes dos pueden escucharlo.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="song-file-title">Título *</Label>
                  <Input id="song-file-title" name="title" required maxLength={200} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="song-file-artist">Artista</Label>
                  <Input id="song-file-artist" name="artist" maxLength={160} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="song-file-note">Dedicatoria / nota</Label>
                <Input id="song-file-note" name="note" maxLength={300} />
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {progress ?? "Guardando…"}
                  </>
                ) : (
                  "Subir canción"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
