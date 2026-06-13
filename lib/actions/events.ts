"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { notifyPartner } from "@/lib/notify";
import { daysBetweenInclusive, parseDetails } from "@/lib/events";
import type { DayDetails } from "@/lib/events";
import type {
  EventAccent,
  EventCategory,
  DayImportance,
  Json,
} from "@/lib/database.types";

function revalidate(eventId?: string) {
  revalidatePath("/torneos");
  revalidatePath("/pista");
  if (eventId) revalidatePath(`/torneos/${eventId}`);
}

export async function createEvent(input: {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  accent?: EventAccent;
  emoji?: string;
  is_shared?: boolean;
}) {
  const title = input.title.trim();
  if (!title) return { error: "Ponle un nombre al torneo." };
  if (!input.start_date || !input.end_date) {
    return { error: "Elige la fecha de inicio y de fin." };
  }
  if (input.end_date < input.start_date) {
    return { error: "La fecha de fin no puede ser antes del inicio." };
  }
  if (daysBetweenInclusive(input.start_date, input.end_date) < 2) {
    return { error: "Un torneo dura mínimo 2 días." };
  }

  const { space, userId } = await getSpaceContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      space_id: space.id,
      created_by: userId,
      title: title.slice(0, 140),
      description: input.description?.trim() || null,
      start_date: input.start_date,
      end_date: input.end_date,
      accent: input.accent ?? "court",
      emoji: input.emoji?.trim()?.slice(0, 8) || null,
      is_shared: input.is_shared ?? false,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await notifyPartner({
    type: "event",
    title: "Nuevo torneo 🏆",
    body: title,
    href: `/torneos/${data.id}`,
  });
  revalidate();
  return { id: data.id };
}

export async function updateEvent(
  id: string,
  fields: {
    title?: string;
    description?: string | null;
    start_date?: string;
    end_date?: string;
    accent?: EventAccent;
    emoji?: string | null;
    status?: "active" | "archived";
    is_shared?: boolean;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").update(fields).eq("id", id);
  if (error) return { error: error.message };
  revalidate(id);
  return {};
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function addDay(input: {
  event_id: string;
  day_date: string;
  category?: EventCategory;
  title: string;
  content?: string;
  at_time?: string;
  location?: string;
  song_url?: string;
  locked?: boolean;
  accent?: EventAccent;
  importance?: DayImportance;
  details?: DayDetails;
}) {
  const title = input.title.trim();
  if (!title) return { error: "Ponle un título a la jornada." };
  if (!input.day_date) return { error: "Elige la fecha de la jornada." };

  const { space, userId } = await getSpaceContext();
  const supabase = await createClient();

  // La jornada debe pertenecer a un torneo de este space.
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", input.event_id)
    .eq("space_id", space.id)
    .maybeSingle();
  if (!event) return { error: "Torneo no encontrado." };

  const { error } = await supabase.from("event_days").insert({
    event_id: input.event_id,
    space_id: space.id,
    author_id: userId,
    day_date: input.day_date,
    category: input.category ?? "other",
    title: title.slice(0, 160),
    content: input.content?.trim() || null,
    at_time: input.at_time?.trim() || null,
    location: input.location?.trim() || null,
    song_url: input.song_url?.trim() || null,
    locked: input.locked ?? false,
    accent: input.accent ?? "court",
    importance: input.importance ?? "normal",
    details: parseDetails(input.details) as unknown as Json,
  });
  if (error) return { error: error.message };

  // Si es sorpresa sellada, NO revelamos el contenido en el aviso.
  await notifyPartner({
    type: "event_day",
    title: input.locked
      ? "Te sellaron una sorpresa 🎁"
      : "Nueva jornada en un torneo 🎾",
    body: input.locked ? "Se revelará el día que le toca." : title,
    href: `/torneos/${input.event_id}`,
  });
  revalidate(input.event_id);
  return {};
}

export async function updateDay(
  id: string,
  eventId: string,
  fields: {
    day_date?: string;
    category?: EventCategory;
    title?: string;
    content?: string | null;
    at_time?: string | null;
    location?: string | null;
    song_url?: string | null;
    locked?: boolean;
    accent?: EventAccent;
    importance?: DayImportance;
    details?: DayDetails;
  },
) {
  const supabase = await createClient();
  const { details, ...rest } = fields;
  const payload = {
    ...rest,
    ...(details ? { details: parseDetails(details) as unknown as Json } : {}),
  };
  const { error } = await supabase
    .from("event_days")
    .update(payload)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidate(eventId);
  return {};
}

export async function setDayDone(id: string, eventId: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_days")
    .update({ done })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidate(eventId);
  return {};
}

export async function deleteDay(id: string, eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("event_days").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate(eventId);
  return {};
}
