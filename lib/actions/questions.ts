"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { notifyPartner } from "@/lib/notify";
import { MAX_ANSWER_EDITS } from "@/lib/rallies";

function revalidate() {
  revalidatePath("/rallies");
  revalidatePath("/pista");
}

export async function askQuestion(body: string) {
  const text = body.trim();
  if (!text) return { error: "Escribe tu pregunta." };

  const { space, userId } = await getSpaceContext();
  const supabase = await createClient();
  const { error } = await supabase.from("questions").insert({
    space_id: space.id,
    author_id: userId,
    body: text,
  });
  if (error) return { error: error.message };
  await notifyPartner({
    type: "rally",
    title: "Te dejó un rally 🎾",
    body: text,
    href: "/rallies",
  });
  revalidate();
  return {};
}

export async function answerQuestion(id: string, answer: string) {
  const text = answer.trim();
  if (!text) return { error: "Escribe tu respuesta." };

  const { userId } = await getSpaceContext();
  const supabase = await createClient();

  const { data: q } = await supabase
    .from("questions")
    .select("answer, answer_edit_count")
    .eq("id", id)
    .maybeSingle();
  if (!q) return { error: "No encontrado." };

  const firstAnswer = q.answer === null;

  if (!firstAnswer && q.answer_edit_count >= MAX_ANSWER_EDITS) {
    return {
      error: "Ya usaste tus 3 ediciones; la respuesta quedó fijada.",
    };
  }

  const { error } = await supabase
    .from("questions")
    .update(
      firstAnswer
        ? {
            answer: text,
            answered_by: userId,
            answered_at: new Date().toISOString(),
          }
        : { answer: text, answer_edit_count: q.answer_edit_count + 1 },
    )
    .eq("id", id);
  if (error) return { error: error.message };

  if (firstAnswer) {
    await notifyPartner({
      type: "rally",
      title: "Respondió tu rally 🎾",
      body: text,
      href: "/rallies",
    });
  }
  revalidate();
  return {};
}

export async function deleteQuestion(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidate();
  return {};
}
