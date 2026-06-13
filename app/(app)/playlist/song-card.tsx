"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Music,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import { deleteSong, updateSong } from "@/lib/actions/songs";
import { externalLabel } from "@/lib/music";
import type { Song } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function SourceBadge({ source }: { source: Song["source"] }) {
  const map = {
    spotify: { label: "Spotify", className: "bg-[#1DB954] text-black" },
    youtube: { label: "YouTube", className: "bg-[#FF0000] text-white" },
    upload: { label: "Archivo", className: "bg-secondary text-secondary-foreground" },
  } as const;
  const { label, className } = map[source];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <Music className="size-3" aria-hidden />
      {label}
    </span>
  );
}

/** Reproductor embebido inline; los iframes se cargan al pulsar play. */
function Player({ song, audioUrl }: { song: Song; audioUrl: string | null }) {
  if (song.source === "upload") {
    if (!audioUrl) {
      return (
        <p className="text-sm text-muted-foreground">
          No se pudo cargar el audio.
        </p>
      );
    }
    return <audio src={audioUrl} controls preload="none" className="w-full" />;
  }

  if (song.source === "spotify") {
    const compact = song.embed_kind === "track" || song.embed_kind === "episode";
    return (
      <iframe
        title={song.title}
        src={`https://open.spotify.com/embed/${song.embed_kind}/${song.external_id}`}
        width="100%"
        height={compact ? 152 : 352}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="rounded-xl border-0"
      />
    );
  }

  // YouTube / YouTube Music
  const src =
    song.embed_kind === "playlist"
      ? `https://www.youtube.com/embed/videoseries?list=${song.external_id}`
      : `https://www.youtube.com/embed/${song.external_id}`;
  return (
    <iframe
      title={song.title}
      src={src}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className="aspect-video w-full rounded-xl border-0"
    />
  );
}

export function SongCard({
  song,
  addedByName,
  audioUrl,
}: {
  song: Song;
  addedByName: string;
  audioUrl: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const externalHref =
    song.source === "upload" ? audioUrl : song.external_url;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <SourceBadge source={song.source} />
              <span className="text-xs text-muted-foreground">
                Añadida por {addedByName} ·{" "}
                {formatDistanceToNow(new Date(song.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
            <h2 className="truncate font-display text-lg leading-snug">
              {song.title}
            </h2>
            {song.artist ? (
              <p className="truncate text-sm text-muted-foreground">
                {song.artist}
              </p>
            ) : null}
            {song.note ? (
              <p className="mt-1 text-sm">{song.note}</p>
            ) : null}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Opciones de la canción"
                disabled={pending}
              >
                <MoreHorizontal className="size-5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" aria-hidden />
                Editar datos
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Quitar de la playlist
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Quitar esta canción?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {song.source === "upload"
                        ? "Se elimina también el archivo de audio. No se puede deshacer."
                        : "Se quita el enlace de la playlist. No se puede deshacer."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        startTransition(async () => {
                          const r = await deleteSong(song.id);
                          if (r.error) toast.error(r.error);
                          else router.refresh();
                        })
                      }
                    >
                      Quitar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {open ? (
          <Player song={song} audioUrl={audioUrl} />
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setOpen(true)} size="sm">
              <Play className="size-4" aria-hidden />
              Reproducir aquí
            </Button>
            {externalHref ? (
              <Button asChild size="sm" variant="outline">
                <a href={externalHref} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" aria-hidden />
                  {externalLabel(song.source, song.external_url)}
                </a>
              </Button>
            ) : null}
          </div>
        )}

        {open && externalHref ? (
          <a
            href={externalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            {externalLabel(song.source, song.external_url)}
          </a>
        ) : null}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Editar canción</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              startTransition(async () => {
                const r = await updateSong(song.id, {
                  title: String(data.get("title") ?? ""),
                  artist: String(data.get("artist") ?? ""),
                  note: String(data.get("note") ?? ""),
                });
                if (r.error) toast.error(r.error);
                else {
                  setEditOpen(false);
                  router.refresh();
                }
              });
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor={`song-title-${song.id}`}>Título</Label>
              <Input
                id={`song-title-${song.id}`}
                name="title"
                defaultValue={song.title}
                maxLength={200}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`song-artist-${song.id}`}>Artista</Label>
              <Input
                id={`song-artist-${song.id}`}
                name="artist"
                defaultValue={song.artist ?? ""}
                maxLength={160}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`song-note-${song.id}`}>Dedicatoria / nota</Label>
              <Input
                id={`song-note-${song.id}`}
                name="note"
                defaultValue={song.note ?? ""}
                maxLength={300}
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
