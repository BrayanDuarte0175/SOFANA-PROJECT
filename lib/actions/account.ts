"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

async function origin(): Promise<string> {
  const h = await headers();
  return (
    h.get("origin") ??
    `https://${h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"}`
  );
}

export interface ActionState {
  error: string | null;
  message: string | null;
}

export async function updateEmail(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Escribe el nuevo correo.", message: null };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${await origin()}/auth/callback?next=/perfil` },
  );
  if (error) return { error: error.message, message: null };
  return {
    error: null,
    message:
      "Te enviamos un enlace de confirmación a tu correo nuevo (y al actual). Ábrelo para terminar el cambio.",
  };
}

export async function updatePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres.", message: null };
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden.", message: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message, message: null };
  return { error: null, message: "Contraseña actualizada. 🎾" };
}

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Escribe tu correo.", message: null };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/actualizar-clave`,
  });
  // No revelamos si el correo existe o no.
  if (error && !error.message.toLowerCase().includes("rate")) {
    return { error: error.message, message: null };
  }
  return {
    error: null,
    message:
      "Si ese correo tiene cuenta, te llegará un enlace para restablecer la contraseña.",
  };
}
