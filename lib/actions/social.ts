"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSpaceContext } from "@/lib/space";
import { notifyPartner } from "@/lib/notify";
import type { CommentTarget } from "@/lib/database.types";

function pathsFor(targetType: CommentTarget, targetId: string) {
  return targetType === "memory" ? [`/highlights/${targetId}`, "/highlights"] : ["/vault"];
}

export async function addComment(
  targetType: CommentTarget,
  targetId: string,
  body: string,
) {
  const text = body.trim();
  if (!text) return { error: "Escribe algo primero." };

  const { space, userId } = await getSpaceContext();
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    space_id: space.id,
    author_id: userId,
    target_type: targetType,
    target_id: targetId,
    body: text,
  });
  if (error) return { error: error.message };
  await notifyPartner({
    type: "comment",
    title: "Nuevo comentario 💬",
    body: text,
    href: targetType === "memory" ? `/highlights/${targetId}` : "/vault",
  });
  pathsFor(targetType, targetId).forEach((p) => revalidatePath(p));
  return {};
}

export async function deleteComment(id: string) {
  const supabase = await createClient();
  const { data: comment } = await supabase
    .from("comments")
    .select("target_type, target_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) return { error: error.message };
  if (comment) {
    pathsFor(comment.target_type, comment.target_id).forEach((p) =>
      revalidatePath(p),
    );
  }
  return {};
}

export async function toggleReaction(
  targetType: CommentTarget,
  targetId: string,
  emoji: string,
) {
  const { space, userId } = await getSpaceContext();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("author_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("reactions").insert({
      space_id: space.id,
      author_id: userId,
      target_type: targetType,
      target_id: targetId,
      emoji,
    });
  }
  pathsFor(targetType, targetId).forEach((p) => revalidatePath(p));
  return {};
}
