"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { notifyPartner } from "@/lib/notify";
import type { ChecklistItem } from "@/lib/database.types";

function revalidate(id?: string) {
  revalidatePath("/tour");
  if (id) revalidatePath(`/tour/${id}`);
}

export async function createTrip(input: {
  title: string;
  destination: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  album_id?: string | null;
}) {
  const title = input.title.trim();
  const destination = input.destination.trim();
  if (!title || !destination) {
    return { error: "Título y destino son obligatorios." };
  }

  const { space, userId } = await getSpaceContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .insert({
      space_id: space.id,
      created_by: userId,
      title,
      destination,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      notes: input.notes?.trim() || null,
      album_id: input.album_id || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await notifyPartner({
    type: "trip",
    title: "Nueva gira en el Tour ✈️",
    body: `${title} · ${destination}`,
    href: `/tour/${data.id}`,
  });
  revalidate();
  return { id: data.id };
}

export async function updateTrip(
  id: string,
  fields: {
    title?: string;
    destination?: string;
    start_date?: string | null;
    end_date?: string | null;
    notes?: string | null;
    album_id?: string | null;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("trips").update(fields).eq("id", id);
  if (error) return { error: error.message };
  revalidate(id);
  return {};
}

export async function setTripChecklist(id: string, checklist: ChecklistItem[]) {
  const supabase = await createClient();
  const sanitized = checklist
    .filter((item) => item.text.trim())
    .map((item) => ({
      id: item.id,
      text: item.text.trim().slice(0, 300),
      done: Boolean(item.done),
    }));
  const { error } = await supabase
    .from("trips")
    .update({ checklist: sanitized })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidate(id);
  return {};
}

export async function deleteTrip(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}
