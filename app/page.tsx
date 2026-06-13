import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TennisBall } from "@/components/tennis/tennis-ball";
import { CourtLine } from "@/components/tennis/court-line";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata: Metadata = {
  title: "SOFANA · Nuestro lado de la pista",
  description:
    "Un espacio privado para dos: recuerdos, promesas, planes y todo lo que pasa dentro de nuestra pista.",
  openGraph: {
    title: "SOFANA · Nuestro lado de la pista",
    description: "Un espacio privado para dos.",
    type: "website",
  },
};

const FEATURES = [
  {
    icon: Sparkles,
    title: "Highlights",
    text: "Los mejores puntos de la relación, con fotos y videos, guardados para siempre.",
  },
  {
    icon: Heart,
    title: "Rallies y Match Points",
    text: "Preguntas que van y vienen como un peloteo, y promesas que se juegan en serio.",
  },
  {
    icon: Lock,
    title: "El Vault",
    text: "Una bóveda privada de verdad: nada se comparte, nada se indexa, nadie más entra.",
  },
];

export default function LandingPage() {
  return (
    <main className="court-texture flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <FadeIn className="flex max-w-2xl flex-col items-center text-center">
        <TennisBall className="size-16" />
        <h1 className="mt-6 font-display text-5xl tracking-tight sm:text-6xl">
          SOFANA
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">
          Nuestro lado de la pista. Un espacio privado para dos: recuerdos,
          promesas, planes y partidos por jugar.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/login">Entrar a la pista</Link>
        </Button>

        <CourtLine className="mt-14 w-full" />

        <div className="mt-8 grid gap-8 text-left sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <Icon className="size-5 text-primary dark:text-ball" aria-hidden />
              <h2 className="mt-2 font-display text-lg">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <p className="mt-14 text-xs text-muted-foreground">
          Juego, set y partido. 🎾
        </p>
      </FadeIn>
    </main>
  );
}
