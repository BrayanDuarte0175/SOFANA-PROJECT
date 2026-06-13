import { TennisBall } from "@/components/tennis/tennis-ball";
import { cn } from "@/lib/utils";

/** Estado vacío temático para listas sin contenido todavía. */
export function EmptyState({
  title,
  hint,
  action,
  className,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      <TennisBall className="size-9 opacity-60" />
      <p className="font-display text-lg">{title}</p>
      {hint ? (
        <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>
      ) : null}
      {action}
    </div>
  );
}
