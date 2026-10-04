"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/admin/types";

export async function saveCollection(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const coverImageUrl = String(formData.get("coverImageUrl") ?? "").trim() || null;
  const productIds = formData.getAll("product_ids").map(String);

  if (!name) throw new Error("Name is required.");

  const slug = slugify(slugInput || name);
  const payload = { name, slug, description, coverImageUrl };

  let collectionId = id;

  if (id) {
    const { error } = await supabase.from("collections").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("collections")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    collectionId = data.id;
  }

  await supabase.from("watch_collections").delete().eq("collectionId", collectionId);
  if (productIds.length > 0) {
    await supabase.from("watch_collections").insert(
      productIds.map((watchId) => ({ collectionId, watchId }))
    );
  }

  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}

export async function deleteCollection(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("collections").delete().eq("id", id);
  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}
