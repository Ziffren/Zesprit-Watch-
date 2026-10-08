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
    label: "Feature",
    where: "Large tile on the left of the showcase, below the watch row.",
    ratio: "4:5 portrait · 1600 × 2000 px or larger",
  },
  {
    slot: 3,
    label: "Promo top",
    where: "Upper tile on the right of the showcase.",
    ratio: "3:2 landscape · 1800 × 1200 px or larger",
  },
  {
    slot: 4,
    label: "Promo bottom",
    where: "Lower tile on the right of the showcase.",
    ratio: "3:2 landscape · 1800 × 1200 px or larger",
  },
  {
    slot: 5,
    label: "Wide banner",
    where: "Long banner closing the showcase, full width.",
    ratio: "3:1 panoramic · 2700 × 900 px or larger",
  },
] as const;

export type SiteImageSlot = (typeof SITE_IMAGE_SLOTS)[number]["slot"];

export type SiteImage = {
  slot: SiteImageSlot;
  imageUrl: string | null;
  alt: string | null;
  heading: string | null;
  caption: string | null;
  linkUrl: string | null;
  updatedAt: string | null;
};

export const SITE_IMAGE_COLUMNS = 'slot, imageUrl, alt, heading, caption, linkUrl, updatedAt';

export function emptySiteImage(slot: SiteImageSlot): SiteImage {
  return { slot, imageUrl: null, alt: null, heading: null, caption: null, linkUrl: null, updatedAt: null };
}

// Rows keyed by slot, every slot present (empty when not set).
export function bySlot(rows: Partial<SiteImage>[] | null): Record<SiteImageSlot, SiteImage> {
  const out = Object.fromEntries(SITE_IMAGE_SLOTS.map((s) => [s.slot, emptySiteImage(s.slot)])) as Record<
    SiteImageSlot,
    SiteImage
  >;
  for (const r of rows ?? []) {
    if (r.slot && r.slot in out) out[r.slot as SiteImageSlot] = { ...out[r.slot as SiteImageSlot], ...r } as SiteImage;
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
