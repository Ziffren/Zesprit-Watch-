"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BulkPriceState = { error: string | null; saved: number | null };

// Saves only the rows whose price changed. Input names are `price:<id>`
// (current value) and `orig:<id>` (value when the page loaded).
export async function saveBulkPrices(_prev: BulkPriceState, formData: FormData): Promise<BulkPriceState> {
  const changes: { id: string; priceCents: number | null }[] = [];
  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("price:")) continue;
    const id = key.slice(6);
    const value = String(raw).replace(/[,\s$]/g, "");
    const orig = String(formData.get(`orig:${id}`) ?? "");
    if (value === orig) continue;
    if (value === "") {
      changes.push({ id, priceCents: null });
      continue;
    }
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return { error: `"${raw}" isn't a valid price.`, saved: null };
    changes.push({ id, priceCents: Math.round(n * 100) });
  }
  if (changes.length === 0) return { error: null, saved: 0 };

  const supabase = await createClient();
  const results = await Promise.all(
    changes.map((c) => supabase.from("products").update({ priceCents: c.priceCents }).eq("id", c.id)),
  );
  const failed = results.filter((r) => r.error);
  if (failed.length) return { error: `${failed.length} price(s) couldn't be saved: ${failed[0].error!.message}`, saved: null };

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/prices");
  revalidatePath("/");
  revalidatePath("/collections/[slug]", "page");
  revalidatePath("/watches/[id]", "page");
  return { error: null, saved: changes.length };
}
