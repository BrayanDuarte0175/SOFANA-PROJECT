"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import { toggleReaction } from "@/lib/actions/social";
import type { CommentTarget, Reaction } from "@/lib/database.types";
import { cn } from "@/lib/utils";

const EMOJIS = ["❤️", "🎾", "😂", "🥹", "🔥"];

export function ReactionsBar({
  targetType,
  targetId,
  reactions,
  userId,
}: {
  targetType: CommentTarget;
  targetId: string;
  reactions: Reaction[];
  userId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Reacciones">
      {EMOJIS.map((emoji) => {
        const all = reactions.filter((r) => r.emoji === emoji);
        const mine = all.some((r) => r.author_id === userId);
        return (
          <motion.button
            key={emoji}
            type="button"
            whileTap={{ scale: 1.25 }}
            disabled={pending}
            aria-pressed={mine}
            aria-label={`Reaccionar con ${emoji}`}
            onClick={() =>
              startTransition(() => {
                toggleReaction(targetType, targetId, emoji);
              })
            }
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition-colors",
              mine
                ? "border-primary bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            <span aria-hidden>{emoji}</span>
            {all.length > 0 ? (
              <span className="tabular-nums">{all.length}</span>
            ) : null}
          </motion.button>
        );
      })}
    </div>
  );
}
