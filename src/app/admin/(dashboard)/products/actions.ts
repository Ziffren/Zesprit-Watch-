"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveProduct(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const productName = String(formData.get("productName") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const descriptionHtml = String(formData.get("descriptionHtml") ?? "");
  const tags = formData.getAll("tags").map(String).filter(Boolean);
  const photoUrls = formData.getAll("photoUrls").map(String).filter(Boolean);
  const collectionIds = formData.getAll("collection_ids").map(String);

  if (!productName) throw new Error("Title is required.");
  if (!brand) throw new Error("Brand is required.");
  if (!id) {
    throw new Error(
      "New watches are created in Watch Report (admin.zespritwatch.com) — this screen only edits the catalogue fields of an existing watch."
    );
  }

  const { error } = await supabase
    .from("watches")
    .update({ productName, brand, descriptionHtml, tags, photoUrls })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.from("watch_collections").delete().eq("watchId", id);
  if (collectionIds.length > 0) {
    await supabase
      .from("watch_collections")
      .insert(collectionIds.map((collectionId) => ({ watchId: id, collectionId })));
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}
