"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarHeart,
  Check,
  Clock,
  Gift,
  Lock,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { setDayDone, deleteDay } from "@/lib/actions/events";
import { ACCENTS, CATEGORIES, IMPORTANCE, daysUntil } from "@/lib/events";
import type { DayView } from "@/lib/events";
import { MiniPlayer } from "@/components/app/mini-player";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

/** Texto corto para la tarjeta compacta. */
function previewText(day: DayView): string {
  if (day.content) return day.content;
  if (day.details.items.length > 0) {
    const cfg = CATEGORIES[day.category];
    return `${day.details.items.length} en la lista · ${cfg.label}`;
  }
  return CATEGORIES[day.category].label;
}

export function DayCard({
  day,
  todayStr,
  onEdit,
}: {
  day: DayView;
  todayStr: string;
  onEdit?: (day: DayView) => void;
}) {
  const reduce = useReducedMotion();
  const [viewOpen, setViewOpen] = useState(false);

  const accent = ACCENTS[day.accent];
  const isToday = day.day_date === todayStr;
  const until = daysUntil(todayStr, day.day_date);
  const grand = day.importance === "grand";
  const special = day.importance === "special";
  const emoji =
    day.importance === "grand"
      ? "🏆"
      : day.importance === "special"
        ? "⭐"
        : CATEGORIES[day.category].emoji;

  return (
    <>
      <button
        type="button"
        onClick={() => setViewOpen(true)}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-shadow hover:shadow-md",
          grand ? "border-transparent shadow-sm" : accent.border,
          isToday && "ring-2 ring-offset-2 ring-offset-background",
          isToday && accent.ring,
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br",
            accent.gradient,
          )}
          aria-hidden
        />
        {grand ? (
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.amber.300/35),transparent_60%)]"
            aria-hidden
          />
        ) : null}
        <ShineOverlay enabled={(grand || special) && !reduce} />

        <div className="relative flex items-center gap-3">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full text-xl",
              accent.soft,
            )}
            aria-hidden
          >
            {day.sealed ? (
              <motion.span
                animate={reduce ? undefined : { rotate: [0, -8, 8, -8, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5 }}
              >
                🎁
              </motion.span>
            ) : (
              emoji
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {format(new Date(`${day.day_date}T00:00:00`), "EEE d MMM", {
                  locale: es,
                })}
              </p>
              {isToday ? (
                <span className="rounded-full bg-ball px-1.5 py-0.5 text-[10px] font-semibold text-ball-foreground">
                  HOY
                </span>
              ) : null}
              {day.importance !== "normal" ? (
                <ImportanceTag importance={day.importance} compact />
              ) : null}
            </div>

            {day.sealed ? (
              <>
                <p className="truncate font-display text-lg">
                  Sorpresa sellada
                </p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Lock className="size-3.5" aria-hidden />
                  {until <= 0
                    ? "Se revela hoy"
                    : until === 1
                      ? "Se revela mañana"
                      : `Se revela en ${until} días`}
                </p>
              </>
            ) : (
              <>
                <p className="truncate font-display text-lg leading-snug">
                  {day.title}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {previewText(day)}
                </p>
              </>
            )}
          </div>

          {day.done && !day.sealed ? (
            <span className="shrink-0 text-emerald-600 dark:text-emerald-400" title="Cumplida">
              <Check className="size-5" aria-hidden />
            </span>
          ) : null}
        </div>
      </button>

      <DayModal
        day={day}
        open={viewOpen}
        onOpenChange={setViewOpen}
        onEdit={onEdit}
        until={until}
      />
    </>
  );
}

function DayModal({
  day,
  open,
  onOpenChange,
  onEdit,
  until,
}: {
  day: DayView;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit?: (day: DayView) => void;
  until: number;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [pending, startTransition] = useTransition();
  const [revealed, setRevealed] = useState(!day.isSurprise);

  const accent = ACCENTS[day.accent];

  // Sorpresa aún sellada (futura): el contenido no existe en el cliente.
  if (day.sealed) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Sorpresa sellada</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <motion.div
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              <Gift className={cn("size-14", accent.text)} aria-hidden />
            </motion.div>
            <p className="font-display text-xl">Hay algo esperándote 🎁</p>
            <p className="text-sm text-muted-foreground">
              <Lock className="mr-1 inline size-3.5" aria-hidden />
              {until <= 0
                ? "Se revela hoy"
                : until === 1
                  ? "Se revela mañana"
                  : `Se revela en ${until} días`}{" "}
              ·{" "}
              {format(new Date(`${day.day_date}T00:00:00`), "d 'de' MMMM", {
                locale: es,
              })}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const showWrapped = day.isSurprise && !revealed;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v && day.isSurprise) setRevealed(false);
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span aria-hidden>{CATEGORIES[day.category].emoji}</span>
            {showWrapped ? "Una sorpresa para ti" : day.title}
          </DialogTitle>
        </DialogHeader>

        {showWrapped ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="flex w-full flex-col items-center gap-3 rounded-xl py-8 text-center transition-transform hover:scale-[1.02]"
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -8, 0], rotate: [0, -4, 4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <Gift className={cn("size-16", accent.text)} aria-hidden />
            </motion.div>
            <span className="font-display text-xl">Toca para abrir 🎁</span>
          </button>
        ) : (
          <motion.div
            initial={day.isSurprise && !reduce ? { opacity: 0, scale: 0.92, y: 12 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="flex flex-col gap-4"
          >
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarHeart className="size-4" aria-hidden />
                {format(new Date(`${day.day_date}T00:00:00`), "EEEE d 'de' MMMM", {
                  locale: es,
                })}
              </span>
              {day.at_time ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" aria-hidden />
                  {day.at_time}
                </span>
              ) : null}
              {day.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" aria-hidden />
                  {day.location}
                </span>
              ) : null}
              {day.importance !== "normal" ? (
                <ImportanceTag importance={day.importance} />
              ) : null}
            </p>

            {day.content ? (
              <p className="whitespace-pre-wrap leading-relaxed">{day.content}</p>
            ) : null}

            {day.details.items.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {day.details.items.map((it, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm",
                      accent.soft,
                    )}
                  >
                    <span className="font-medium">{it.label}</span>
                    {it.meta ? (
                      <span className="text-muted-foreground">{it.meta}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}

            {day.song_url ? <MiniPlayer url={day.song_url} /> : null}

            {day.canEdit ? (
              <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                <Button
                  size="sm"
                  variant={day.done ? "secondary" : "default"}
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await setDayDone(day.id, day.event_id, !day.done);
                      if (r.error) toast.error(r.error);
                      else router.refresh();
                    })
                  }
                >
                  <Check className="size-4" aria-hidden />
                  {day.done ? "Cumplida" : "Marcar cumplida"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    if (onEdit) onEdit(day);
                    else router.push(`/torneos/${day.event_id}`);
                  }}
                >
                  <Pencil className="size-4" aria-hidden />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive">
                      <Trash2 className="size-4" aria-hidden />
                      Borrar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Borrar esta jornada?</AlertDialogTitle>
                      <AlertDialogDescription>
                        No se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          startTransition(async () => {
                            const r = await deleteDay(day.id, day.event_id);
                            if (r.error) toast.error(r.error);
                            else {
                              onOpenChange(false);
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
              </div>
            ) : day.done ? (
              <div className="border-t pt-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                  <Check className="size-4" aria-hidden />
                  Cumplida
                </span>
              </div>
            ) : null}
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ImportanceTag({
  importance,
  compact = false,
}: {
  importance: DayView["importance"];
  compact?: boolean;
}) {
  if (importance === "normal") return null;
  const info = IMPORTANCE[importance];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
        compact ? "text-[10px]" : "text-xs",
        importance === "grand"
          ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950"
          : "bg-amber-400/20 text-amber-700 dark:text-amber-300",
      )}
    >
      {info.emoji} {info.label}
    </span>
  );
}

/** Brillo animado que cruza la tarjeta (días especiales). */
function ShineOverlay({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
      initial={{ x: "-120%" }}
      animate={{ x: "220%" }}
      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 3.5 }}
    />
  );
}
