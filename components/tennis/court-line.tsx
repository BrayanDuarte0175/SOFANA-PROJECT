import { cn } from "@/lib/utils";

/** Separador con el doble trazo de las líneas de una pista. */
export function CourtLine({ className }: { className?: string }) {
  return (
    <div role="separator" className={cn("court-line my-6", className)} />
  );
}
