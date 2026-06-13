"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { uploadAvatar } from "@/lib/upload";
import {
  updateDisplayName,
  updateAvatar,
  updateSpaceName,
} from "@/lib/actions/profile";
import type { Profile } from "@/lib/database.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  me,
  myAvatarUrl,
  partner,
  partnerAvatarUrl,
  spaceName,
}: {
  me: Profile;
  myAvatarUrl: string | null;
  partner: Profile | null;
  partnerAvatarUrl: string | null;
  spaceName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(file: File | undefined) {
    if (!file) return;
    setAvatarBusy(true);
    try {
      const up = await uploadAvatar(me.id, file);
      if (up.error || !up.path) {
        toast.error(up.error ?? "No se pudo subir el avatar.");
        return;
      }
      const r = await updateAvatar(up.path);
      if (r.error) toast.error(r.error);
      else {
        toast.success("Avatar actualizado");
        router.refresh();
      }
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg font-normal">
            Tu ficha
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="group relative rounded-full focus-visible:outline-2 focus-visible:outline-ring"
              onClick={() => fileRef.current?.click()}
              aria-label="Cambiar avatar"
              disabled={avatarBusy}
            >
              <Avatar className="size-20">
                {myAvatarUrl ? <AvatarImage src={myAvatarUrl} alt="" /> : null}
                <AvatarFallback className="text-2xl">
                  {(me.display_name || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {avatarBusy ? (
                  <Loader2 className="size-6 animate-spin text-white" aria-hidden />
                ) : (
                  <Camera className="size-6 text-white" aria-hidden />
                )}
              </span>
            </button>
            <div className="text-sm text-muted-foreground">
              <p>JPG, PNG o WebP, máx. 5 MB.</p>
              <p>Haz clic en la foto para cambiarla.</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleAvatarChange(e.target.files?.[0])}
            />
          </div>

          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = String(new FormData(e.currentTarget).get("display_name") ?? "");
              startTransition(async () => {
                const r = await updateDisplayName(name);
                if (r.error) toast.error(r.error);
                else {
                  toast.success("Nombre actualizado");
                  router.refresh();
                }
              });
            }}
          >
            <Label htmlFor="display-name">Tu nombre en la pista</Label>
            <div className="flex gap-2">
              <Input
                id="display-name"
                name="display_name"
                defaultValue={me.display_name}
                maxLength={60}
                required
              />
              <Button type="submit" disabled={pending}>
                Guardar
              </Button>
            </div>
          </form>

          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = String(new FormData(e.currentTarget).get("space_name") ?? "");
              startTransition(async () => {
                const r = await updateSpaceName(name);
                if (r.error) toast.error(r.error);
                else {
                  toast.success("Nombre del match actualizado");
                  router.refresh();
                }
              });
            }}
          >
            <Label htmlFor="space-name">Nombre de nuestro match</Label>
            <div className="flex gap-2">
              <Input
                id="space-name"
                name="space_name"
                defaultValue={spaceName}
                maxLength={80}
                required
              />
              <Button type="submit" variant="secondary" disabled={pending}>
                Guardar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg font-normal">
            Al otro lado de la red
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partner ? (
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                {partnerAvatarUrl ? (
                  <AvatarImage src={partnerAvatarUrl} alt="" />
                ) : null}
                <AvatarFallback className="text-xl">
                  {(partner.display_name || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{partner.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  Tu compañera de dobles de por vida.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no ha entrado a la pista. Cuando inicie sesión, aparecerá
              aquí automáticamente.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
