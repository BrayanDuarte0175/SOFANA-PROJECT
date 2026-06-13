"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { setTripChecklist } from "@/lib/actions/trips";
import type { ChecklistItem } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

/**
 * Checklist editable por ambos: cada cambio se guarda al instante
 * con actualización optimista local.
 */
export function TripChecklist({
  tripId,
  initial,
}: {
  tripId: string;
  initial: ChecklistItem[];
}) {
  const [items, setItems] = useState<ChecklistItem[]>(initial);
  const [text, setText] = useState("");
  const [, startTransition] = useTransition();

  function persist(next: ChecklistItem[]) {
    setItems(next);
    startTransition(async () => {
      const r = await setTripChecklist(tripId, next);
      if (r.error) toast.error(r.error);
    });
  }

  const done = items.filter((i) => i.done).length;

  return (
    <section aria-label="Checklist del viaje">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl">Checklist de la gira</h2>
        {items.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {done}/{items.length} listos
          </p>
        ) : null}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          persist([
            ...items,
            { id: crypto.randomUUID(), text: text.trim(), done: false },
          ]);
          setText("");
        }}
      >
        <label htmlFor="checklist-new" className="sr-only">
          Nuevo pendiente
        </label>
        <Input
          id="checklist-new"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          placeholder="Pasaportes, raquetas, protector solar…"
        />
        <Button type="submit" size="icon" aria-label="Añadir a la checklist">
          <Plus className="size-4" aria-hidden />
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Sin pendientes todavía. Lo que anoten aquí lo ven y editan ambos.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted"
            >
              <Checkbox
                id={`chk-${item.id}`}
                checked={item.done}
                onCheckedChange={(checked) =>
                  persist(
                    items.map((i) =>
                      i.id === item.id ? { ...i, done: checked === true } : i,
                    ),
                  )
                }
              />
              <label
                htmlFor={`chk-${item.id}`}
                className={`flex-1 text-sm ${item.done ? "text-muted-foreground line-through" : ""}`}
              >
                {item.text}
              </label>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Quitar “${item.text}”`}
                className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => persist(items.filter((i) => i.id !== item.id))}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
