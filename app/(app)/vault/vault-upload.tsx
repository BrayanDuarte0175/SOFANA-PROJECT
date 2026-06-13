"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { uploadMedia } from "@/lib/upload";
import { addVaultMedia } from "@/lib/actions/vault";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VaultUploadDialog({ spaceId }: { spaceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const files = (data.getAll("media") as File[]).filter((f) => f.size > 0);
    const caption = String(data.get("caption") ?? "");

    if (files.length === 0) {
      toast.error("Elige al menos un archivo.");
      return;
    }

    setBusy(true);
    try {
      setProgress(`Subiendo 0/${files.length}…`);
      const { uploaded, errors } = await uploadMedia(
        "vault",
        spaceId,
        files,
        (done, total) => setProgress(`Subiendo ${done}/${total}…`),
      );
      errors.forEach((e) => toast.error(e));

      if (uploaded.length > 0) {
        const r = await addVaultMedia(
          uploaded.map((u) => ({ ...u, caption })),
        );
        if (r.error) {
          toast.error(r.error);
        } else {
          toast.success(
            uploaded.length === 1
              ? "Guardado en la bóveda 🔒"
              : `${uploaded.length} archivos guardados en la bóveda 🔒`,
          );
          setOpen(false);
          router.refresh();
        }
      }
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="size-4" aria-hidden />
          Subir al Vault
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Subir al Vault</DialogTitle>
          <DialogDescription>
            Fotos y videos privados, hasta 50 MB por archivo. Solo ustedes
            dos podrán verlos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="vault-files">Archivos *</Label>
            <Input
              id="vault-files"
              name="media"
              type="file"
              multiple
              required
              accept="image/*,video/mp4,video/quicktime,video/webm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="vault-caption">Pie de foto (opcional)</Label>
            <Input id="vault-caption" name="caption" maxLength={200} />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {progress ?? "Guardando…"}
              </>
            ) : (
              "Guardar en la bóveda"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
