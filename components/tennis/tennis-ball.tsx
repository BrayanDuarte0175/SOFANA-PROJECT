import { cn } from "@/lib/utils";

/** Pelota de tenis en SVG: círculo lima con las costuras características. */
export function TennisBall({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-6", className)}
    >
      <circle cx="16" cy="16" r="15" className="fill-ball" />
      <path
        d="M3.5 7 A 18 18 0 0 1 3.5 25"
        fill="none"
        strokeWidth="2"
        className="stroke-line"
        strokeLinecap="round"
      />
      <path
        d="M28.5 7 A 18 18 0 0 0 28.5 25"
        fill="none"
        strokeWidth="2"
        className="stroke-line"
        strokeLinecap="round"
      />
    </svg>
  );
}
