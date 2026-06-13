// Parser de enlaces de música (puro, usable en cliente y servidor).
// Reconoce Spotify y YouTube / YouTube Music, y produce la URL de
// reproductor embebido para escuchar dentro de la app.

import type { SongSource } from "@/lib/database.types";

export interface ParsedMusicLink {
  source: "spotify" | "youtube";
  /** spotify: track/album/playlist/episode/show ; youtube: video/playlist */
  kind: string;
  externalId: string;
  /** URL para el <iframe> embebido */
  embedUrl: string;
  /** URL para "abrir en la app externa" */
  url: string;
  /** Endpoint oEmbed para autocompletar título (o null si no aplica) */
  oembedUrl: string | null;
}

const SPOTIFY_KINDS = [
  "track",
  "album",
  "playlist",
  "episode",
  "show",
  "artist",
];

function spotifyResult(kind: string, id: string): ParsedMusicLink {
  const canonical = `https://open.spotify.com/${kind}/${id}`;
  return {
    source: "spotify",
    kind,
    externalId: id,
    embedUrl: `https://open.spotify.com/embed/${kind}/${id}`,
    url: canonical,
    oembedUrl: `https://open.spotify.com/oembed?url=${encodeURIComponent(canonical)}`,
  };
}

export function parseMusicLink(raw: string): ParsedMusicLink | null {
  const input = raw.trim();
  if (!input) return null;

  // Spotify URI: spotify:track:ID
  const uri = input.match(
    /^spotify:(track|album|playlist|episode|show|artist):([A-Za-z0-9]+)/i,
  );
  if (uri) return spotifyResult(uri[1].toLowerCase(), uri[2]);

  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  // ---------- Spotify ----------
  if (host === "open.spotify.com") {
    const segs = u.pathname.split("/").filter(Boolean);
    // Quita prefijos de idioma como /intl-es/
    const cleaned = segs[0]?.startsWith("intl-") ? segs.slice(1) : segs;
    const kind = cleaned[0]?.toLowerCase();
    const id = cleaned[1];
    if (kind && id && SPOTIFY_KINDS.includes(kind)) {
      return spotifyResult(kind, id);
    }
    return null;
  }

  // ---------- YouTube / YouTube Music ----------
  if (
    host === "youtube.com" ||
    host === "music.youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtu.be"
  ) {
    let videoId: string | null = null;
    let listId: string | null = null;

    if (host === "youtu.be") {
      videoId = u.pathname.split("/").filter(Boolean)[0] ?? null;
    } else {
      videoId = u.searchParams.get("v");
      listId = u.searchParams.get("list");
      const m = u.pathname.match(/\/(embed|shorts|v)\/([A-Za-z0-9_-]{6,})/);
      if (!videoId && m) videoId = m[2];
    }

    if (videoId && /^[A-Za-z0-9_-]{6,}$/.test(videoId)) {
      return {
        source: "youtube",
        kind: "video",
        externalId: videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        url: input,
        oembedUrl: `https://www.youtube.com/oembed?url=${encodeURIComponent(
          `https://www.youtube.com/watch?v=${videoId}`,
        )}&format=json`,
      };
    }

    if (listId) {
      return {
        source: "youtube",
        kind: "playlist",
        externalId: listId,
        embedUrl: `https://www.youtube.com/embed/videoseries?list=${listId}`,
        url: input,
        oembedUrl: null,
      };
    }
    return null;
  }

  return null;
}

/** Etiqueta para el botón de abrir en app externa, según el enlace. */
export function externalLabel(source: SongSource, url: string | null): string {
  if (source === "spotify") return "Abrir en Spotify";
  if (source === "youtube") {
    return url?.includes("music.youtube")
      ? "Abrir en YouTube Music"
      : "Abrir en YouTube";
  }
  return "Abrir archivo";
}
