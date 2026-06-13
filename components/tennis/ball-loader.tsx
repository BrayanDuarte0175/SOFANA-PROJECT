import { TennisBall } from "@/components/tennis/tennis-ball";
import { cn } from "@/lib/utils";

/** Loader temático: una pelota que bota con su sombra. */
export function BallLoader({
  label = "Cargando…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-12",
        className,
      )}
    >
      <div className="relative h-16 w-10">
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2"
          style={{ animation: "sofana-bounce 0.9s infinite" }}
        >
          <TennisBall className="size-7" />
        </div>
        <div
          className="absolute bottom-1 left-1/2 h-1.5 w-7 -translate-x-1/2 rounded-full bg-foreground/30 blur-[2px]"
          style={{ animation: "sofana-shadow 0.9s infinite" }}
        />
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
