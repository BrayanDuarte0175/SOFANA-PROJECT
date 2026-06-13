"use client";

import { useActionState } from "react";
import { login, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const initialState: AuthState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@email.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Sacando…
              </>
            ) : (
              "Entrar a la pista"
            )}
          </Button>
          <a
            href="/recuperar"
            className="text-center text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </a>
          <p className="text-center text-xs text-muted-foreground">
            Espacio privado por invitación. No hay registro público.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
