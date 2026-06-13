import type { Metadata } from "next";
import Link from "next/link";
import { TennisBall } from "@/components/tennis/tennis-ball";
import { FadeIn } from "@/components/motion/fade-in";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false, follow: false },
};

export default function RecuperarPage() {
  return (
    <main className="court-texture flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <FadeIn className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <TennisBall className="size-12" />
          <h1 className="font-display text-3xl tracking-tight">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-sm text-muted-foreground">
            Te enviamos un enlace para crear una nueva.
          </p>
        </div>
        <ResetForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline-offset-2 hover:underline">
            Volver a entrar
          </Link>
        </p>
      </FadeIn>
    </main>
  );
}
