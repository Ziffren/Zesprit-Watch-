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
