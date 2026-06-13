import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Space } from "@/lib/database.types";

export interface SpaceContext {
  userId: string;
  space: Space;
  me: Profile;
  partner: Profile | null;
}

/**
 * Devuelve el space del usuario autenticado, creándolo o uniéndose
 * si hace falta (la segunda persona "reclama" el lugar libre).
 * Cacheado por request para no repetir queries entre componentes.
 */
export const getSpaceContext = cache(async (): Promise<SpaceContext> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resuelve el space de forma atómica: une al lugar libre de la
  // pareja si existe, o crea uno nuevo. Toda la lógica delicada de
  // emparejamiento vive en el servidor (RPC SECURITY DEFINER).
  const { data: space, error } = await supabase.rpc("join_or_create_space");
  if (error || !space) {
    throw new Error(
      `No se pudo resolver el space: ${error?.message ?? "sin datos"}`,
    );
  }

  const memberIds = [space.member_a, space.member_b].filter(
    (id): id is string => id !== null,
  );
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", memberIds);

  const me = profiles?.find((p) => p.id === user.id);
  const partner = profiles?.find((p) => p.id !== user.id) ?? null;
  if (!me) throw new Error("Perfil no encontrado");

  return { userId: user.id, space, me, partner };
});
