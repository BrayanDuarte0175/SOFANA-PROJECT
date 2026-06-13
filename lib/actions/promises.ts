"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { notifyPartner } from "@/lib/notify";
import type { PromiseStatus } from "@/lib/database.types";

function revalidate() {
  revalidatePath("/match-points");
  revalidatePath("/pista");
}

export async function createPromise(body: string, dueDate?: string) {
  const text = body.trim();
  if (!text) return { error: "Escribe la promesa." };

  const { space, userId } = await getSpaceContext();
  const supabase = await createClient();
  const { error } = await supabase.from("promises").insert({
    space_id: space.id,
    author_id: userId,
    body: text,
    due_date: dueDate || null,
  });
  if (error) return { error: error.message };
  await notifyPartner({
    type: "promise",
    title: "Nuevo Match Point 🏅",
    body: text,
    href: "/match-points",
  });
  revalidate();
  return {};
}

export async function setPromiseStatus(id: string, status: PromiseStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("promises")
    .update({
      status,
      completed_at: status === "pending" ? null : new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}

export async function deletePromise(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("promises").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}
