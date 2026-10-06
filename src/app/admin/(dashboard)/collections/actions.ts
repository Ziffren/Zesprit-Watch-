"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/admin/types";
import { sanitizeRules } from "@/lib/collection-rules";

export async function saveCollection(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const coverImageUrl = String(formData.get("coverImageUrl") ?? "").trim() || null;
  const type = String(formData.get("collection_type") ?? "manual");
  const isBrand = type === "brand";
  const isSmart = type === "smart";
  const productIds = isSmart ? [] : formData.getAll("product_ids").map(String);
  const parse = (key: string) => {
    try {
      return sanitizeRules(JSON.parse(String(formData.get(key) ?? "[]")));
    } catch {
      return [];
    }
  };
  const rules = isSmart ? parse("rules_json") : [];
  const excludeRules = isSmart ? parse("exclude_json") : [];
  const matchAll = formData.get("match_all") !== "false";

  if (!name) throw new Error("Name is required.");
  if (isSmart && rules.length === 0) {
    throw new Error("An automated collection needs at least one condition.");
  }

  const slug = slugify(slugInput || name);
  const payload = {
    name,
    slug,
    description,
    coverImageUrl,
    isBrand,
    isSmart,
    matchAll,
    rules,
    excludeRules,
  };

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

  // A product has exactly one brand: anything added to this brand collection
  // leaves its previous brand collection, and products.brand follows.
  if (isBrand && productIds.length > 0) {
    const { data: otherBrands } = await supabase
      .from("collections")
      .select("id")
      .eq("isBrand", true)
      .neq("id", collectionId);
    const otherBrandIds = (otherBrands ?? []).map((b) => b.id);
    for (let i = 0; i < productIds.length; i += 100) {
      const chunk = productIds.slice(i, i + 100);
      if (otherBrandIds.length > 0) {
        await supabase
          .from("watch_collections")
          .delete()
          .in("watchId", chunk)
          .in("collectionId", otherBrandIds);
      }
      await supabase.from("products").update({ brand: name }).in("id", chunk);
    }
  }

  await supabase.from("watch_collections").delete().eq("collectionId", collectionId);
  if (productIds.length > 0) {
    await supabase.from("watch_collections").insert(
      productIds.map((watchId) => ({ collectionId, watchId }))
    );
  }

  revalidatePath("/admin/collections");
  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect(`/admin/collections/${collectionId}`);
}

export async function deleteCollection(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("collections").delete().eq("id", id);
  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}
