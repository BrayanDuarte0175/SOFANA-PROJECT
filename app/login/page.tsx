import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { TennisBall } from "@/components/tennis/tennis-ball";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata: Metadata = {
  title: "Entrar a la pista",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="court-texture flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <FadeIn className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <TennisBall className="size-12" />
          <h1 className="font-display text-4xl tracking-tight">SOFANA</h1>
          <p className="text-sm text-muted-foreground">
            Nuestro lado de la pista. Solo para dos.
          </p>
        </div>
        <LoginForm />
      </FadeIn>
    </main>
  );
}
