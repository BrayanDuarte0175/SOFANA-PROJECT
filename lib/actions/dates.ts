"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { notifyPartner } from "@/lib/notify";
import type { DateStatus } from "@/lib/database.types";

function revalidate() {
  revalidatePath("/citas");
  revalidatePath("/pista");
}

export async function createDate(input: {
  title: string;
  scheduled_at: string;
  location?: string;
  notes?: string;
}) {
  const title = input.title.trim();
  if (!title) return { error: "Ponle un título a la cita." };
  if (!input.scheduled_at) return { error: "Elige fecha y hora." };

  const { space, userId } = await getSpaceContext();
  const supabase = await createClient();
  const { error } = await supabase.from("dates").insert({
    space_id: space.id,
    created_by: userId,
    title,
    scheduled_at: new Date(input.scheduled_at).toISOString(),
    location: input.location?.trim() || null,
    notes: input.notes?.trim() || null,
  });
  if (error) return { error: error.message };
  await notifyPartner({
    type: "date",
    title: "Nueva cita agendada 💚",
    body: title,
    href: "/citas",
  });
  revalidate();
  return {};
}

export async function updateDate(
  id: string,
  fields: {
    title?: string;
    scheduled_at?: string;
    location?: string | null;
    notes?: string | null;
  },
) {
  const supabase = await createClient();
  const payload = {
    ...fields,
    ...(fields.scheduled_at
      ? { scheduled_at: new Date(fields.scheduled_at).toISOString() }
      : {}),
  };
  const { error } = await supabase.from("dates").update(payload).eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function setDateStatus(id: string, status: DateStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("dates").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deleteDate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("dates").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}
