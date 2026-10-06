"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WatchStatus } from "@/lib/admin/types";

export async function saveProduct(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const productName = String(formData.get("productName") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const status = String(formData.get("status") ?? "AVAILABLE") as WatchStatus;
  const priceInput = String(formData.get("price") ?? "").trim();
  const priceCents = priceInput ? Math.round(parseFloat(priceInput) * 100) : null;
  const descriptionHtml = String(formData.get("descriptionHtml") ?? "");
  const tags = formData.getAll("tags").map(String).filter(Boolean);
  const photoUrls = formData.getAll("photoUrls").map(String).filter(Boolean);
  const collectionIds = formData.getAll("collection_ids").map(String);

  if (!productName) throw new Error("Title is required.");
  if (!brand) throw new Error("Brand is required.");
  if (priceInput && (Number.isNaN(priceCents) || priceCents! < 0)) {
    throw new Error("Enter a valid price.");
  }

  const payload = { productName, brand, status, priceCents, descriptionHtml, tags, photoUrls };
  let productId = id;

  if (id) {
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from("products").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    productId = data.id;
  }

  await supabase.from("watch_collections").delete().eq("watchId", productId);
  if (collectionIds.length > 0) {
    await supabase
      .from("watch_collections")
      .insert(collectionIds.map((collectionId) => ({ watchId: productId, collectionId })));
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}
