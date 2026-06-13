// Helpers puros de Torneos (eventos). Sin React, sin Date.now():
// el "hoy" se calcula en la página y se pasa como string YYYY-MM-DD.

import type {
  EventAccent,
  EventCategory,
  DayImportance,
  EventDay,
} from "@/lib/database.types";

// ---------- Categorías de jornada ----------
export const CATEGORIES: Record<
  EventCategory,
  { label: string; emoji: string }
> = {
  date: { label: "Cita en persona", emoji: "🎾" },
  movie: { label: "Película", emoji: "🎬" },
  call: { label: "Llamada", emoji: "📞" },
  game: { label: "Juego", emoji: "🎮" },
  poem: { label: "Poema", emoji: "✍️" },
  song: { label: "Canción", emoji: "🎵" },
  message: { label: "Mensaje", emoji: "💌" },
  surprise: { label: "Sorpresa", emoji: "🎁" },
  other: { label: "Otro", emoji: "✨" },
};

export const CATEGORY_OPTIONS = (
  Object.keys(CATEGORIES) as EventCategory[]
).map((key) => ({ value: key, ...CATEGORIES[key] }));

// ---------- Acentos de color (personalización de tarjetas) ----------
export interface AccentStyle {
  label: string;
  dot: string;
  soft: string;
  border: string;
  ring: string;
  gradient: string;
  text: string;
}

export const ACCENTS: Record<EventAccent, AccentStyle> = {
  court: {
    label: "Pista",
    dot: "bg-emerald-500",
    soft: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    ring: "ring-emerald-500/40",
    gradient: "from-emerald-500/30 via-emerald-500/10 to-transparent",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  ball: {
    label: "Pelota",
    dot: "bg-lime-400",
    soft: "bg-lime-400/10",
    border: "border-lime-400/50",
    ring: "ring-lime-400/50",
    gradient: "from-lime-400/30 via-lime-400/10 to-transparent",
    text: "text-lime-700 dark:text-lime-300",
  },
  clay: {
    label: "Arcilla",
    dot: "bg-orange-500",
    soft: "bg-orange-500/10",
    border: "border-orange-500/40",
    ring: "ring-orange-500/40",
    gradient: "from-orange-500/30 via-orange-500/10 to-transparent",
    text: "text-orange-700 dark:text-orange-300",
  },
  rosa: {
    label: "Rosa",
    dot: "bg-rose-500",
    soft: "bg-rose-500/10",
    border: "border-rose-500/40",
    ring: "ring-rose-500/40",
    gradient: "from-rose-500/30 via-rose-500/10 to-transparent",
    text: "text-rose-700 dark:text-rose-300",
  },
  cielo: {
    label: "Cielo",
    dot: "bg-sky-500",
    soft: "bg-sky-500/10",
    border: "border-sky-500/40",
    ring: "ring-sky-500/40",
    gradient: "from-sky-500/30 via-sky-500/10 to-transparent",
    text: "text-sky-700 dark:text-sky-300",
  },
  violeta: {
    label: "Violeta",
    dot: "bg-violet-500",
    soft: "bg-violet-500/10",
    border: "border-violet-500/40",
    ring: "ring-violet-500/40",
    gradient: "from-violet-500/30 via-violet-500/10 to-transparent",
    text: "text-violet-700 dark:text-violet-300",
  },
};

export const ACCENT_OPTIONS = (Object.keys(ACCENTS) as EventAccent[]).map(
  (key) => ({ value: key, ...ACCENTS[key] }),
);

// ---------- Importancia (días especiales) ----------
export const IMPORTANCE: Record<
  DayImportance,
  { label: string; emoji: string }
> = {
  normal: { label: "Normal", emoji: "" },
  special: { label: "Punto de oro", emoji: "⭐" },
  grand: { label: "Grand Slam", emoji: "🏆" },
};

export const IMPORTANCE_OPTIONS = (
  Object.keys(IMPORTANCE) as DayImportance[]
).map((key) => ({ value: key, ...IMPORTANCE[key] }));

// ---------- Detalles estructurados por jornada ----------
export interface DayDetailItem {
  label: string;
  meta: string | null;
}
export interface DayDetails {
  items: DayDetailItem[];
}

export function parseDetails(value: unknown): DayDetails {
  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { items?: unknown }).items)
  ) {
    const raw = (value as { items: unknown[] }).items;
    const items: DayDetailItem[] = raw
      .filter(
        (it): it is { label: string; meta?: unknown } =>
          Boolean(it) &&
          typeof (it as { label?: unknown }).label === "string" &&
          (it as { label: string }).label.trim().length > 0,
      )
      .map((it) => ({
        label: it.label.trim().slice(0, 160),
        meta:
          typeof it.meta === "string" && it.meta.trim()
            ? it.meta.trim().slice(0, 80)
            : null,
      }));
    return { items };
  }
  return { items: [] };
}

/** Qué campos tiene sentido mostrar/pedir según la categoría. */
export interface CategoryFields {
  time: boolean;
  location: boolean;
  song: boolean;
  content: boolean;
  contentLabel: string;
  list: null | { title: string; itemLabel: string; metaLabel: string | null };
}

export const CATEGORY_FIELDS: Record<EventCategory, CategoryFields> = {
  date: {
    time: true,
    location: true,
    song: false,
    content: true,
    contentLabel: "Plan / notas",
    list: null,
  },
  movie: {
    time: true,
    location: false,
    song: false,
    content: true,
    contentLabel: "Notas (dónde verla, snacks…)",
    list: { title: "Películas a ver", itemLabel: "Película", metaLabel: "Género" },
  },
  call: {
    time: true,
    location: false,
    song: false,
    content: true,
    contentLabel: "De qué hablar / notas",
    list: null,
  },
  game: {
    time: true,
    location: false,
    song: false,
    content: true,
    contentLabel: "Notas",
    list: { title: "Juegos", itemLabel: "Juego", metaLabel: null },
  },
  poem: {
    time: false,
    location: false,
    song: false,
    content: true,
    contentLabel: "Tu poema",
    list: null,
  },
  message: {
    time: false,
    location: false,
    song: false,
    content: true,
    contentLabel: "Tu mensaje",
    list: null,
  },
  song: {
    time: false,
    location: false,
    song: true,
    content: true,
    contentLabel: "Dedicatoria",
    list: null,
  },
  surprise: {
    time: false,
    location: false,
    song: true,
    content: true,
    contentLabel: "Contenido de la sorpresa",
    list: { title: "Lista", itemLabel: "Elemento", metaLabel: "Detalle" },
  },
  other: {
    time: true,
    location: true,
    song: true,
    content: true,
    contentLabel: "Detalles",
    list: { title: "Lista", itemLabel: "Elemento", metaLabel: "Detalle" },
  },
};

// ---------- Lógica de revelado de sorpresas ----------
/**
 * Una jornada sellada (locked) solo se revela:
 *  - si no está sellada, o
 *  - si la mira su propio autor (para poder editarla), o
 *  - si ya llegó su día (hoy >= su fecha).
 */
export function isRevealed(
  row: Pick<EventDay, "locked" | "author_id" | "day_date">,
  viewerId: string,
  todayStr: string,
): boolean {
  if (!row.locked) return true;
  if (row.author_id === viewerId) return true;
  return todayStr >= row.day_date;
}

/** Vista segura de una jornada: si está sellada, el contenido NO se incluye. */
export interface DayView {
  id: string;
  event_id: string;
  day_date: string;
  category: EventCategory;
  title: string | null;
  content: string | null;
  at_time: string | null;
  location: string | null;
  song_url: string | null;
  details: DayDetails;
  locked: boolean;
  done: boolean;
  accent: EventAccent;
  importance: DayImportance;
  author_id: string;
  /** true => sellada y aún no revelada: el contenido viene vacío. */
  sealed: boolean;
  /** true => es (o fue) una sorpresa: dispara animación de apertura. */
  isSurprise: boolean;
  /** true => el espectador es el autor: puede editar/borrar/marcar. */
  canEdit: boolean;
}

export function toDayView(
  row: EventDay,
  viewerId: string,
  todayStr: string,
  eventShared = false,
): DayView {
  const revealed = isRevealed(row, viewerId, todayStr);
  const sealed = !revealed;
  return {
    id: row.id,
    event_id: row.event_id,
    day_date: row.day_date,
    category: sealed ? "surprise" : row.category,
    title: sealed ? null : row.title,
    content: sealed ? null : row.content,
    at_time: sealed ? null : row.at_time,
    location: sealed ? null : row.location,
    song_url: sealed ? null : row.song_url,
    details: sealed ? { items: [] } : parseDetails(row.details),
    locked: row.locked,
    done: row.done,
    accent: row.accent,
    importance: row.importance,
    author_id: row.author_id,
    sealed,
    isSurprise: row.locked,
    // Puede gestionarla el autor; o cualquiera si el torneo es compartido.
    canEdit: eventShared || row.author_id === viewerId,
  };
}

// ---------- Utilidades de fechas ----------
/** Fecha local en formato YYYY-MM-DD (sin desfase por UTC). */
export function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Días entre dos fechas YYYY-MM-DD (inclusive en ambos extremos). */
export function daysBetweenInclusive(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
}

/** Días desde hoy hasta una fecha (negativo si ya pasó). */
export function daysUntil(todayStr: string, dateStr: string): number {
  const a = new Date(`${todayStr}T00:00:00`);
  const b = new Date(`${dateStr}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
