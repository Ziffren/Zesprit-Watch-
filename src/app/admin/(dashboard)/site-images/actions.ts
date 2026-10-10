"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SITE_IMAGE_SLOTS } from "@/lib/site-images";

export type SaveSiteImageState = { error: string | null; savedAt: number | null };

const clean = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

// Saves one homepage image slot. The image itself is already uploaded to the
// watch-photos bucket by the browser; this stores its URL + text.
export async function saveSiteImage(_prev: SaveSiteImageState, formData: FormData): Promise<SaveSiteImageState> {
  const slot = Number(formData.get("slot"));
  if (!SITE_IMAGE_SLOTS.some((s) => s.slot === slot)) return { error: "Unknown image slot.", savedAt: null };

  const imageUrl = clean(formData.get("imageUrl"));
  const linkUrl = clean(formData.get("linkUrl"));
  if (linkUrl && !/^(\/(?!\/)|https?:\/\/)/i.test(linkUrl)) {
    return { error: "Link must start with / (a page on this site) or https://", savedAt: null };
  }
  const alt = clean(formData.get("alt"));
  if (imageUrl && !alt) {
    return { error: "Add a short description of the image (for screen readers and Google).", savedAt: null };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_images")
    .update({ imageUrl, alt, heading: clean(formData.get("heading")), caption: clean(formData.get("caption")), linkUrl })
    .eq("slot", slot);
  if (error) return { error: error.message, savedAt: null };

  revalidatePath("/");
  revalidatePath("/admin/site-images");
  return { error: null, savedAt: Date.now() };
}

export type BulkSiteImage = { slot: number; imageUrl: string; alt: string };

// Bulk upload: sets the photo + description of several slots at once,
// leaving each slot's heading, caption and link as they were.
export async function saveSiteImagesBulk(items: BulkSiteImage[]): Promise<{ error: string | null }> {
  if (items.length === 0) return { error: "Nothing to save." };
  const slots = new Set<number>();
  for (const it of items) {
    if (!SITE_IMAGE_SLOTS.some((s) => s.slot === it.slot)) return { error: "Unknown image slot." };
    if (slots.has(it.slot)) return { error: `Two photos are set for area ${it.slot} — pick a different area for one.` };
    slots.add(it.slot);
    if (!/^https?:\/\//.test(it.imageUrl)) return { error: "A photo hasn't finished uploading." };
    if (!it.alt.trim()) return { error: `Add a short description for the photo in area ${it.slot}.` };
  }

  const supabase = await createClient();
  for (const it of items) {
    const { error } = await supabase
      .from("site_images")
      .update({ imageUrl: it.imageUrl, alt: it.alt.trim().slice(0, 300) })
      .eq("slot", it.slot);
    if (error) return { error: error.message };
  }
  revalidatePath("/");
  revalidatePath("/admin/site-images");
  return { error: null };
}
