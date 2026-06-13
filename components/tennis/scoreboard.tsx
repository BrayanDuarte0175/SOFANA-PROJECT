import { cn } from "@/lib/utils";

const SCORE_STEPS = ["0", "15", "30", "40"] as const;

/** Convierte un conteo en marcador de tenis: 0, 15, 30, 40, Juego. */
export function tennisScore(count: number): string {
  if (count >= SCORE_STEPS.length) return "Juego";
  return SCORE_STEPS[count];
}

/** Tarjeta de marcador estilo pista para el dashboard. */
export function Scoreboard({
  items,
  className,
}: {
  items: { label: string; count: number }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center gap-1 bg-court px-3 py-4 text-line"
        >
          <span
            className="font-mono text-3xl font-bold tabular-nums"
            aria-label={`${item.count} ${item.label}`}
          >
            {tennisScore(item.count)}
          </span>
          <span className="text-xs uppercase tracking-widest opacity-80">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
