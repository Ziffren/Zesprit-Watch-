"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify, type PostStatus } from "@/lib/admin/types";

export async function savePost(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const bodyHtml = String(formData.get("bodyHtml") ?? "").trim() || null;
  const coverImageUrl = String(formData.get("coverImageUrl") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "DRAFT") as PostStatus;
  const wasPublished = String(formData.get("wasPublished") ?? "") === "true";

  if (!title) throw new Error("Title is required.");

  const slug = slugify(slugInput || title);
  const payload: Record<string, unknown> = {
    title,
    slug,
    excerpt,
    bodyHtml,
    coverImageUrl,
    status,
  };

  // Stamp publishedAt the first time a post moves to PUBLISHED; leave it
  // alone on every subsequent save so re-editing a live post doesn't bump
  // its publish date.
  if (status === "PUBLISHED" && !wasPublished) {
    payload.publishedAt = new Date().toISOString();
  }

  if (id) {
    const { error } = await supabase.from("posts").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("posts").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/content");
  revalidatePath("/journal");
  redirect("/admin/content");
}

export async function deletePost(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("posts").delete().eq("id", id);
  revalidatePath("/admin/content");
  revalidatePath("/journal");
  redirect("/admin/content");
}
