"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteMemoryMedia } from "@/lib/actions/memories";
import type { MediaType } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
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

export function MediaGrid({
  items,
}: {
  items: { id: string; type: MediaType; url: string | null }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Este highlight aún no tiene fotos ni videos.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.id} className="group relative overflow-hidden rounded-xl border bg-muted">
          {item.url ? (
            item.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt=""
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            ) : (
              <video
                src={item.url}
                controls
                preload="metadata"
                className="aspect-square w-full bg-black object-contain"
              />
            )
          ) : (
            <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
              No disponible
            </div>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Borrar archivo"
                className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Borrar este archivo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se elimina del almacenamiento y no se puede recuperar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    startTransition(async () => {
                      const r = await deleteMemoryMedia(item.id);
                      if (r.error) toast.error(r.error);
                      router.refresh();
                    })
                  }
                >
                  Borrar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </li>
      ))}
    </ul>
  );
}
