"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TennisBall } from "@/components/tennis/tennis-ball";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <TennisBall className="size-10 opacity-70" />
      <h2 className="font-display text-2xl">La pelota se fue fuera</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Algo falló al cargar esta sección. Inténtalo de nuevo; si sigue
        fallando, revisa tu conexión.
      </p>
      <Button onClick={reset}>Repetir el punto</Button>
    </div>
  );
}
