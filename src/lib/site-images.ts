import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// The five homepage image slots, in display order. Slot numbers are the
// primary key of `site_images` (Watch Report rls/0023) — don't renumber.
export const SITE_IMAGE_SLOTS = [
  {
    slot: 1,
    label: "Hero banner",
    where: "Full-width banner at the very top of the homepage, under the menu.",
    ratio: "2:1 landscape · 2400 × 1200 px or larger",
  },
  {
    slot: 2,
    label: "Brand List",
    where: "“Shopping Brand List” — a grid of brand tiles; each photo gets a name and a link, shown in this order.",
    ratio: "1:1 square · 800 × 800 px or larger",
  },
  {
    slot: 3,
    label: "Promo left",
    where: "Left photo of the pair below the watch row.",
    ratio: "3:2 landscape · 1800 × 1200 px or larger",
  },
  {
    slot: 4,
    label: "Promo right",
    where: "Right photo of the pair below the watch row.",
    ratio: "3:2 landscape · 1800 × 1200 px or larger",
  },
  {
    slot: 5,
    label: "Wide banner",
    where: "Full-width banner after the Brand List.",
    ratio: "3:1 panoramic · 2700 × 900 px or larger",
  },
] as const;

export type BrandTile = { url: string; label: string; href: string };

export const BRAND_LIST_SLOT = 2;

export type SiteImageSlot = (typeof SITE_IMAGE_SLOTS)[number]["slot"];

export type SiteImage = {
  slot: SiteImageSlot;
  /** First photo (= imageUrls[0]), or null when the block is empty. */
  imageUrl: string | null;
  /** All photos in order; more than one shows as a slideshow. */
  imageUrls: string[];
  /** Brand List (slot 2) tiles, in display order. */
  items: BrandTile[];
  alt: string | null;
  heading: string | null;
  caption: string | null;
  linkUrl: string | null;
  updatedAt: string | null;
};

export const SITE_IMAGE_COLUMNS = 'slot, imageUrl, imageUrls, items, alt, heading, caption, linkUrl, updatedAt';

export function emptySiteImage(slot: SiteImageSlot): SiteImage {
  return { slot, imageUrl: null, imageUrls: [], items: [], alt: null, heading: null, caption: null, linkUrl: null, updatedAt: null };
}

// Rows keyed by slot, every slot present (empty when not set).
export function bySlot(rows: Partial<SiteImage>[] | null): Record<SiteImageSlot, SiteImage> {
  const out = Object.fromEntries(SITE_IMAGE_SLOTS.map((s) => [s.slot, emptySiteImage(s.slot)])) as Record<
    SiteImageSlot,
    SiteImage
  >;
  for (const r of rows ?? []) {
    if (!r.slot || !(r.slot in out)) continue;
    const urls = r.imageUrls?.length ? r.imageUrls : r.imageUrl ? [r.imageUrl] : [];
    const items = Array.isArray(r.items) ? r.items.filter((t) => t && typeof t.url === "string") : [];
    out[r.slot as SiteImageSlot] = {
      ...out[r.slot as SiteImageSlot],
      ...r,
      imageUrls: urls,
      imageUrl: urls[0] ?? null,
      items,
    } as SiteImage;
  }
  return out;
}

// Homepage read (public, anon key).
export async function getSiteImages(): Promise<Record<SiteImageSlot, SiteImage>> {
  if (!isSupabaseConfigured) return bySlot([]);
  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from("site_images").select(SITE_IMAGE_COLUMNS);
    return bySlot(data as Partial<SiteImage>[] | null);
  } catch {
    return bySlot([]);
  }
}
