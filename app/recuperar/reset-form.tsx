"use client";

import { useActionState } from "react";
import { requestPasswordReset, type ActionState } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const initial: ActionState = { error: null, message: null };

export function ResetForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);

  return (
    <Card>
      <CardContent className="pt-6">
        {state.message ? (
          <p className="text-sm text-foreground" role="status">
            {state.message}
          </p>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Tu correo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu@email.com"
              />
            </div>
            {state.error ? (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Enviar enlace
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
