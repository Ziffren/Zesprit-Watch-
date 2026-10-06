"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/admin/types";
import { sanitizeRules } from "@/lib/collection-rules";

export type SaveCollectionState = { error: string | null };

// Returns a uniquely-taken slug: the requested one if free, otherwise
// `slug-2`, `slug-3`… (like Shopify handles). Excludes the collection being
// edited so re-saving doesn't collide with itself.
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  selfId: string
): Promise<{ slug: string; takenBy: string | null }> {
  const { data } = await supabase
    .from("collections")
    .select("id, name, slug")
    .like("slug", `${base}%`);
  const others = (data ?? []).filter((c) => c.id !== selfId);
  const taken = new Set(others.map((c) => c.slug));
  const takenBy = others.find((c) => c.slug === base)?.name ?? null;
  if (!taken.has(base)) return { slug: base, takenBy: null };
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return { slug: `${base}-${n}`, takenBy };
}

export async function saveCollection(
  _prev: SaveCollectionState,
  formData: FormData
): Promise<SaveCollectionState> {
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

  if (!name) return { error: "Title is required." };
  if (isSmart && rules.length === 0) {
    return { error: "An automated collection needs at least one condition." };
  }

  const base = slugify(slugInput || name);
  if (!base) return { error: "Title needs at least one letter or number." };
  const { slug, takenBy } = await uniqueSlug(supabase, base, id);
  // A slug typed by hand is a deliberate URL choice — don't silently change it.
  if (slugInput && takenBy) {
    return { error: `The slug "${base}" is already used by "${takenBy}". Choose another or leave it blank.` };
  }

  if (isBrand) {
    const { data: sameName } = await supabase
      .from("collections")
      .select("id")
      .eq("isBrand", true)
      .ilike("name", name.replace(/[%_\\]/g, (ch) => `\\${ch}`))
      .neq("id", id || "00000000-0000-0000-0000-000000000000");
    if (sameName && sameName.length > 0) {
      return { error: `A brand collection named "${name}" already exists.` };
    }
  }

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
    if (error) return { error: `Couldn't save: ${error.message}` };
  } else {
    const { data, error } = await supabase
      .from("collections")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { error: `Couldn't create the collection: ${error.message}` };
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
