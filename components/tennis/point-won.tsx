"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { TennisBall } from "@/components/tennis/tennis-ball";

/**
 * Celebración de "punto ganado": overlay breve con la pelota cruzando
 * la pantalla y el mensaje. Usar con el hook usePointWon().
 */
export function usePointWon() {
  const [message, setMessage] = useState<string | null>(null);

  const celebrate = useCallback((msg = "¡Punto ganado!") => {
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 1600);
  }, []);

  const node = <PointWonOverlay message={message} />;
  return { celebrate, node };
}

function PointWonOverlay({ message }: { message: string | null }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="flex items-center gap-3 rounded-full bg-primary px-6 py-3 text-primary-foreground shadow-xl"
            initial={reduce ? { opacity: 0 } : { scale: 0.6, y: 24 }}
            animate={reduce ? { opacity: 1 } : { scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
          >
            {!reduce && (
              <motion.span
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              >
                <TennisBall className="size-6" />
              </motion.span>
            )}
            <span className="font-display text-lg">{message}</span>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
