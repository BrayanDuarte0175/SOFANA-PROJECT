import type { Metadata } from "next";
import { TennisBall } from "@/components/tennis/tennis-ball";
import { FadeIn } from "@/components/motion/fade-in";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  robots: { index: false, follow: false },
};

export default function ActualizarClavePage() {
  return (
    <main className="court-texture flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <FadeIn className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <TennisBall className="size-12" />
          <h1 className="font-display text-3xl tracking-tight">
            Nueva contraseña
          </h1>
          <p className="text-sm text-muted-foreground">
            Elige una contraseña nueva para tu cuenta.
          </p>
        </div>
        <NewPasswordForm />
      </FadeIn>
    </main>
  );
}
