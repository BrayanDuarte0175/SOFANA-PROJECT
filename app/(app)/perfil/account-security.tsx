"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  updateEmail,
  updatePassword,
  type ActionState,
} from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionState = { error: null, message: null };

export function AccountSecurity({ currentEmail }: { currentEmail: string }) {
  const [emailState, emailAction, emailPending] = useActionState(
    updateEmail,
    initial,
  );
  const [passState, passAction, passPending] = useActionState(
    updatePassword,
    initial,
  );

  useEffect(() => {
    if (passState.message) toast.success(passState.message);
  }, [passState.message]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg font-normal">
          Acceso y seguridad
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Cambiar correo */}
        <form action={emailAction} className="flex flex-col gap-2">
          <Label htmlFor="new-email">Correo de acceso</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="new-email"
              name="email"
              type="email"
              defaultValue={currentEmail}
              autoComplete="email"
              required
              className="flex-1"
            />
            <Button type="submit" variant="secondary" disabled={emailPending}>
              {emailPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Cambiar correo
            </Button>
          </div>
          {emailState.error ? (
            <p role="alert" className="text-sm text-destructive">
              {emailState.error}
            </p>
          ) : null}
          {emailState.message ? (
            <p role="status" className="text-sm text-muted-foreground">
              {emailState.message}
            </p>
          ) : null}
        </form>

        {/* Cambiar contraseña */}
        <form action={passAction} className="flex flex-col gap-2">
          <Label htmlFor="acc-password">Nueva contraseña</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              id="acc-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
            />
            <Input
              id="acc-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repetir contraseña"
              required
              minLength={8}
            />
          </div>
          {passState.error ? (
            <p role="alert" className="text-sm text-destructive">
              {passState.error}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="secondary"
            disabled={passPending}
            className="self-start"
          >
            {passPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Cambiar contraseña
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
