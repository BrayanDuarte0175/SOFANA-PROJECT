"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { addDay, updateDay } from "@/lib/actions/events";
import {
  ACCENT_OPTIONS,
  CATEGORY_OPTIONS,
  CATEGORY_FIELDS,
  IMPORTANCE_OPTIONS,
} from "@/lib/events";
import type { DayView, DayDetailItem } from "@/lib/events";
import type {
  EventAccent,
  EventCategory,
  DayImportance,
} from "@/lib/database.types";
import { DayCard } from "./day-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/tennis/empty-state";
import { cn } from "@/lib/utils";

export function DaysTimeline({
  eventId,
  days,
  todayStr,
  defaultDate,
  canAdd,
}: {
  eventId: string;
  days: DayView[];
  todayStr: string;
  defaultDate: string;
  canAdd: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<DayView | null>(null);

  return (
    <div>
      {canAdd ? (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Añadir jornada
          </Button>
        </div>
      ) : null}

      {days.length === 0 ? (
        <EmptyState
          title="Este torneo no tiene jornadas todavía"
          hint={
            canAdd
              ? "Añade el primer día: una cita, una película, un poema… lo que quieras."
              : "Quien creó el torneo aún no añade jornadas."
          }
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {days.map((day) => (
            <li key={day.id}>
              <DayCard day={day} todayStr={todayStr} onEdit={setEditing} />
            </li>
          ))}
        </ol>
      )}

      {canAdd ? (
        <DayDialog
          eventId={eventId}
          open={addOpen}
          onOpenChange={setAddOpen}
          defaultDate={defaultDate}
        />
      ) : null}
      <DayDialog
        eventId={eventId}
        day={editing ?? undefined}
        open={editing !== null}
        onOpenChange={(v) => !v && setEditing(null)}
        defaultDate={defaultDate}
      />
    </div>
  );
}

function AccentPicker({
  value,
  onChange,
}: {
  value: EventAccent;
  onChange: (v: EventAccent) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
      {ACCENT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          aria-label={opt.label}
          onClick={() => onChange(opt.value)}
          className={cn(
            "size-7 rounded-full ring-offset-2 ring-offset-background transition",
            opt.dot,
            value === opt.value ? "ring-2 ring-foreground" : "opacity-70",
          )}
        />
      ))}
    </div>
  );
}

function ListEditor({
  items,
  onChange,
  itemLabel,
  metaLabel,
}: {
  items: DayDetailItem[];
  onChange: (items: DayDetailItem[]) => void;
  itemLabel: string;
  metaLabel: string | null;
}) {
  const [label, setLabel] = useState("");
  const [meta, setMeta] = useState("");

  function add() {
    if (!label.trim()) return;
    onChange([...items, { label: label.trim(), meta: meta.trim() || null }]);
    setLabel("");
    setMeta("");
  }

  return (
    <div className="flex flex-col gap-2">
      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm"
            >
              <span>
                {it.label}
                {it.meta ? (
                  <span className="text-muted-foreground"> · {it.meta}</span>
                ) : null}
              </span>
              <button
                type="button"
                aria-label={`Quitar ${it.label}`}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={itemLabel}
          maxLength={160}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        {metaLabel ? (
          <Input
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            placeholder={metaLabel}
            maxLength={80}
            className="w-32"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
        ) : null}
        <Button type="button" variant="secondary" size="icon" onClick={add} aria-label="Añadir a la lista">
          <Plus className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function DayDialog({
  eventId,
  day,
  open,
  onOpenChange,
  defaultDate,
}: {
  eventId: string;
  day?: DayView;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [date, setDate] = useState(day?.day_date ?? defaultDate);
  const [category, setCategory] = useState<EventCategory>(
    day?.category ?? "date",
  );
  const [title, setTitle] = useState(day?.title ?? "");
  const [atTime, setAtTime] = useState(day?.at_time ?? "");
  const [location, setLocation] = useState(day?.location ?? "");
  const [content, setContent] = useState(day?.content ?? "");
  const [songUrl, setSongUrl] = useState(day?.song_url ?? "");
  const [items, setItems] = useState<DayDetailItem[]>(day?.details?.items ?? []);
  const [locked, setLocked] = useState(day?.locked ?? false);
  const [accent, setAccent] = useState<EventAccent>(day?.accent ?? "court");
  const [importance, setImportance] = useState<DayImportance>(
    day?.importance ?? "normal",
  );

  const isEdit = Boolean(day);
  const fields = CATEGORY_FIELDS[category];

  function submit() {
    if (!title.trim()) {
      toast.error("Ponle un título a la jornada.");
      return;
    }
    startTransition(async () => {
      // Solo enviamos los campos que la categoría usa; el resto se limpia.
      const payload = {
        day_date: date,
        category,
        title,
        content: fields.content ? content : "",
        at_time: fields.time ? atTime : "",
        location: fields.location ? location : "",
        song_url: fields.song ? songUrl : "",
        details: { items: fields.list ? items : [] },
        locked,
        accent,
        importance,
      };
      const r = isEdit
        ? await updateDay(day!.id, eventId, payload)
        : await addDay({ event_id: eventId, ...payload });
      if (r.error) {
        toast.error(r.error);
      } else {
        toast.success(isEdit ? "Jornada actualizada" : "¡Jornada añadida! 🎾");
        onOpenChange(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !pending && onOpenChange(v)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Editar jornada" : "Nueva jornada"}
          </DialogTitle>
          <DialogDescription>
            Elige el tipo y solo verás los campos que tienen sentido. Puedes
            sellarla como sorpresa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="day-cat">Tipo de jornada</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as EventCategory)}
            >
              <SelectTrigger id="day-cat" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.emoji} {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="day-date">Fecha *</Label>
              <Input
                id="day-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {fields.time ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="day-time">Hora</Label>
                <Input
                  id="day-time"
                  type="time"
                  value={atTime}
                  onChange={(e) => setAtTime(e.target.value)}
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="day-title">Título *</Label>
            <Input
              id="day-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              placeholder="Cena sorpresa, Maratón de pelis, Un poema para ti…"
            />
          </div>

          {fields.list ? (
            <div className="flex flex-col gap-2">
              <Label>{fields.list.title}</Label>
              <ListEditor
                items={items}
                onChange={setItems}
                itemLabel={fields.list.itemLabel}
                metaLabel={fields.list.metaLabel}
              />
            </div>
          ) : null}

          {fields.content ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="day-content">{fields.contentLabel}</Label>
              <Textarea
                id="day-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={category === "poem" || category === "message" ? 5 : 3}
              />
            </div>
          ) : null}

          {fields.location ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="day-loc">Lugar</Label>
              <Input
                id="day-loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={160}
              />
            </div>
          ) : null}

          {fields.song ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="day-song">Canción (Spotify / YouTube)</Label>
              <Input
                id="day-song"
                value={songUrl}
                onChange={(e) => setSongUrl(e.target.value)}
                inputMode="url"
                placeholder="https://open.spotify.com/track/…"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label>Color de la tarjeta</Label>
            <AccentPicker value={accent} onChange={setAccent} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="day-imp">Importancia del día</Label>
            <Select
              value={importance}
              onValueChange={(v) => setImportance(v as DayImportance)}
            >
              <SelectTrigger id="day-imp" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMPORTANCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.emoji ? `${opt.emoji} ` : ""}
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Los días “Grand Slam” lucen un diseño exclusivo y brillante.
            </p>
          </div>

          <label className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
            <span>
              <span className="font-medium">Sellar como sorpresa 🎁</span>
              <span className="block text-xs text-muted-foreground">
                Tu pareja verá una tarjeta de regalo, pero el contenido solo se
                revela el día de la jornada.
              </span>
            </span>
            <Switch checked={locked} onCheckedChange={setLocked} />
          </label>

          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {isEdit ? "Guardar cambios" : "Añadir jornada"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
