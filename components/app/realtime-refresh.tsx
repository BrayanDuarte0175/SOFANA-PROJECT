"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Tablas con space_id (se filtran por el space).
const SPACE_TABLES = [
  "memories",
  "questions",
  "promises",
  "dates",
  "trips",
  "vault_media",
  "songs",
  "events",
  "event_days",
  "albums",
  "comments",
  "reactions",
];

/**
 * Escucha cambios en la base de datos del space y refresca la vista
 * casi al instante, para que lo que hace una persona aparezca en la
 * pantalla de la otra sin recargar a mano.
 */
export function RealtimeRefresh({ spaceId }: { spaceId: string }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 250);
    };

    const channel = supabase.channel(`space:${spaceId}`);
    for (const table of SPACE_TABLES) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `space_id=eq.${spaceId}`,
        },
        refresh,
      );
    }
    // memory_media no tiene space_id; el RLS igual protege el acceso.
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "memory_media" },
      refresh,
    );
    channel.subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [spaceId, router]);

  return null;
}
