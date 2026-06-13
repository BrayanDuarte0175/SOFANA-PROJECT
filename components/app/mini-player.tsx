"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { parseMusicLink, externalLabel } from "@/lib/music";
import { Button } from "@/components/ui/button";

/** Reproductor embebido compacto para un enlace de Spotify/YouTube. */
export function MiniPlayer({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const parsed = parseMusicLink(url);

  if (!parsed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline dark:text-ball"
      >
        <ExternalLink className="size-3.5" aria-hidden />
        Abrir enlace
      </a>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <Play className="size-4" aria-hidden />
          Reproducir
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={parsed.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" aria-hidden />
            {externalLabel(parsed.source, parsed.url)}
          </a>
        </Button>
      </div>
    );
  }

  if (parsed.source === "spotify") {
    const compact = parsed.kind === "track" || parsed.kind === "episode";
    return (
      <iframe
        title="Reproductor de Spotify"
        src={parsed.embedUrl}
        width="100%"
        height={compact ? 152 : 352}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="rounded-xl border-0"
      />
    );
  }

  return (
    <iframe
      title="Reproductor de YouTube"
      src={parsed.embedUrl}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className="aspect-video w-full rounded-xl border-0"
    />
  );
}
