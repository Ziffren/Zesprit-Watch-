"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BRAND_LIST_SLOT, SITE_IMAGE_SLOTS, type BrandTile } from "@/lib/site-images";

export type SaveSiteImageState = { error: string | null; savedAt: number | null };

const clean = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

// Saves one homepage image block: its photos (in order — more than one
// becomes a slideshow) and text. Photos are already uploaded to the
// watch-photos bucket by the browser; this stores their URLs.
export async function saveSiteImage(_prev: SaveSiteImageState, formData: FormData): Promise<SaveSiteImageState> {
  const slot = Number(formData.get("slot"));
  if (!SITE_IMAGE_SLOTS.some((s) => s.slot === slot)) return { error: "Unknown image slot.", savedAt: null };

  const imageUrls = formData
    .getAll("imageUrls")
    .map((v) => String(v).trim())
    .filter((u) => /^https?:\/\//.test(u))
    .slice(0, 20);
  const imageUrl = imageUrls[0] ?? null;
  const linkUrl = clean(formData.get("linkUrl"));
  if (linkUrl && !/^(\/(?!\/)|https?:\/\/)/i.test(linkUrl)) {
    return { error: "Link must start with / (a page on this site) or https://", savedAt: null };
  }
  const alt = clean(formData.get("alt"));
  if (imageUrl && !alt) {
    return { error: "Add a short description of the photos (for screen readers and Google).", savedAt: null };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_images")
    .update({ imageUrl, imageUrls, alt, heading: clean(formData.get("heading")), caption: clean(formData.get("caption")), linkUrl })
    .eq("slot", slot);
  if (error) return { error: error.message, savedAt: null };

  revalidatePath("/");
  revalidatePath("/admin/site-images");
  return { error: null, savedAt: Date.now() };
}

const validLink = (v: string) => /^(\/(?!\/)|https?:\/\/)/i.test(v);

// Brand List (slot 2): ordered tiles, each a photo + name + link.
export async function saveBrandList(input: {
  heading: string;
  linkUrl: string;
  items: BrandTile[];
}): Promise<{ error: string | null }> {
  const items: BrandTile[] = [];
  for (const [i, t] of input.items.slice(0, 60).entries()) {
    const url = String(t.url ?? "").trim();
    const label = String(t.label ?? "").trim().slice(0, 60);
    const href = String(t.href ?? "").trim().slice(0, 300);
    if (!/^https?:\/\//.test(url)) return { error: `Tile ${i + 1}: the photo hasn't finished uploading.` };
    if (!label) return { error: `Tile ${i + 1}: add a name (e.g. Credor).` };
    if (href && !validLink(href)) return { error: `Tile ${i + 1}: link must start with / or https://` };
    items.push({ url, label, href });
  }
  const linkUrl = input.linkUrl.trim();
  if (linkUrl && !validLink(linkUrl)) return { error: "“View all” link must start with / or https://" };

  const supabase = await createClient();
  const imageUrls = items.map((t) => t.url);
  const { error } = await supabase
    .from("site_images")
    .update({
      items,
      imageUrls,
      imageUrl: imageUrls[0] ?? null,
      alt: items.length ? "Shop by brand" : null,
      heading: input.heading.trim() || null,
      linkUrl: linkUrl || null,
    })
    .eq("slot", BRAND_LIST_SLOT);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/site-images");
  return { error: null };
}
