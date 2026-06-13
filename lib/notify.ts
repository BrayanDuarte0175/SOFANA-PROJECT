import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";

/**
 * Crea una notificación para la pareja. Se llama desde las Server
 * Actions tras crear contenido. Es "best-effort": si algo falla
 * (p. ej. aún no hay pareja), no rompe la acción principal.
 */
export async function notifyPartner(input: {
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
}): Promise<void> {
  try {
    const { space, userId, partner } = await getSpaceContext();
    if (!partner) return;
    const supabase = await createClient();
    await supabase.from("notifications").insert({
      space_id: space.id,
      recipient_id: partner.id,
      actor_id: userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
    });
  } catch {
    // silencioso a propósito
  }
}
