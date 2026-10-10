"use client";

import { createClient } from "@/lib/supabase/client";
import { notifyCounts } from "@/lib/store-events";

// One wishlist lookup per page load, shared by every heart on the page.
// saved_watches is keyed (userId, watchId), so a customer counts once per
// piece however often they tap.

export const WISH_EVENT = "zesprit:wish";
export type WishChange = { watchId: string; saved: boolean };

type Wishlist = { userId: string | null; saved: Set<string> };
let cache: Promise<Wishlist> | null = null;

export function loadWishlist(): Promise<Wishlist> {
  cache ??= (async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { userId: null, saved: new Set<string>() };
      const { data } = await supabase.from("saved_watches").select("watchId").eq("userId", user.id);
      return { userId: user.id, saved: new Set((data ?? []).map((r) => r.watchId as string)) };
    } catch {
      return { userId: null, saved: new Set<string>() };
    }
  })();
  return cache;
}

export function loginHref() {
  const here = window.location.pathname + window.location.search;
  return `/account/login?next=${encodeURIComponent(here)}`;
}

// Returns the new saved state, or null when signed out / on failure.
export async function toggleWish(watchId: string): Promise<boolean | null> {
  const w = await loadWishlist();
  if (!w.userId) return null;
  const supabase = createClient();
  const wasSaved = w.saved.has(watchId);
  const { error } = wasSaved
    ? await supabase.from("saved_watches").delete().eq("userId", w.userId).eq("watchId", watchId)
    : await supabase.from("saved_watches").upsert({ userId: w.userId, watchId }, { ignoreDuplicates: true });
  if (error) return wasSaved;
  if (wasSaved) w.saved.delete(watchId);
  else w.saved.add(watchId);
  window.dispatchEvent(new CustomEvent<WishChange>(WISH_EVENT, { detail: { watchId, saved: !wasSaved } }));
  notifyCounts();
  return !wasSaved;
}
