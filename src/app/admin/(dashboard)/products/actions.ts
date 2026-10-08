"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WatchStatus } from "@/lib/admin/types";

export async function saveProduct(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const productName = String(formData.get("productName") ?? "").trim();
  const brandCollectionId = String(formData.get("brand_collection_id") ?? "");
  const status = String(formData.get("status") ?? "AVAILABLE") as WatchStatus;
  const priceInput = String(formData.get("price") ?? "").trim();
  const priceCents = priceInput ? Math.round(parseFloat(priceInput) * 100) : null;
  const descriptionHtml = String(formData.get("descriptionHtml") ?? "");
  const tags = formData.getAll("tags").map(String).filter(Boolean);
  const photoUrls = formData.getAll("photoUrls").map(String).filter(Boolean);
  const collectionIds = formData.getAll("collection_ids").map(String);
  const soldAtInput = String(formData.get("sold_at") ?? "").trim();
  // Only a sold piece carries a sold date; going back to Available clears it.
  const soldAt = status === "SOLD" && soldAtInput ? soldAtInput : null;

  if (!productName) throw new Error("Title is required.");
  if (!brandCollectionId) throw new Error("Choose a brand collection.");
  // Sale pricing: "Reduced price" on → price is the sale price and
  // compare_at the original. Off (or not actually lower) → no reduction.
  const onSale = formData.get("on_sale") === "on";
  const compareAtInput = String(formData.get("compare_at") ?? "").trim();
  const compareAtCents = onSale && compareAtInput ? Math.round(parseFloat(compareAtInput) * 100) : null;
  if (onSale) {
    if (compareAtCents == null || Number.isNaN(compareAtCents) || priceCents == null || Number.isNaN(priceCents)) {
      throw new Error("Enter both the original and the sale price.");
    }
    if (priceCents >= compareAtCents) throw new Error("The sale price must be lower than the original price.");
  }
  if (soldAt && !/^\d{4}-\d{2}-\d{2}$/.test(soldAt)) throw new Error("Enter a valid sold date.");
  if (priceInput && (Number.isNaN(priceCents) || priceCents! < 0)) {
    throw new Error("Enter a valid price.");
  }

  // products.brand mirrors the chosen brand collection's name — the
  // storefront, admin list, search, and analytics all read that column.
  const { data: brandCollection, error: brandError } = await supabase
    .from("collections")
    .select("name")
    .eq("id", brandCollectionId)
    .eq("isBrand", true)
    .maybeSingle();
  if (brandError || !brandCollection) throw new Error("That brand collection no longer exists.");
  const brand = brandCollection.name;

  // reducedAt drives the 30-day "Reduced" badge: keep it while the same
  // reduction stands, restamp when the reduction is new or its prices change.
  let reducedAt: string | null = null;
  if (onSale) {
    reducedAt = new Date().toISOString();
    if (id) {
      const { data: prev } = await supabase
        .from("products")
        .select("priceCents, compareAtCents, reducedAt")
        .eq("id", id)
        .maybeSingle();
      if (prev?.reducedAt && prev.compareAtCents === compareAtCents && prev.priceCents === priceCents) {
        reducedAt = prev.reducedAt;
      }
    }
  }

  const payload = {
    productName,
    brand,
    status,
    priceCents,
    compareAtCents,
    reducedAt,
    soldAt,
    descriptionHtml,
    tags,
    photoUrls,
  };
  let productId = id;

  if (id) {
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from("products").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    productId = data.id;
  }

  const allCollectionIds = [brandCollectionId, ...collectionIds.filter((c) => c !== brandCollectionId)];
  await supabase.from("watch_collections").delete().eq("watchId", productId);
  await supabase
    .from("watch_collections")
    .insert(allCollectionIds.map((collectionId) => ({ watchId: productId, collectionId })));

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/collections/[slug]", "page");
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
