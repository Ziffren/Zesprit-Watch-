import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatPrice } from "@/lib/admin/types";
import { matchesCollection, type Rule } from "@/lib/collection-rules";
import type { CollectionQuery, StatusFilter } from "@/lib/collection-query";

// "New" and "Reduced" badges both look back this far.
const BADGE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type StorefrontPiece = {
  id: string;
  name: string;
  brand: string;
  detail: string;
  price: string;
  priceSet: boolean;
  /** Original price, struck through — only while the piece is "Reduced". */
  compareAt: string | null;
  isNew: boolean;
  isReduced: boolean;
  /** A deposit has been received — still listed, not purchasable. */
  onHold: boolean;
  /** Sold pieces only appear when a listing is filtered to show them. */
  sold: boolean;
  imageUrl: string | null;
  hour: number;
  min: number;
};

// Shown until the owner publishes real products in /admin/products.
const placeholder = (id: string, name: string, detail: string, hour: number, min: number): StorefrontPiece => ({
  id, name, detail, hour, min, brand: "Z’esprit Watch",
  price: "Price on request", priceSet: false, compareAt: null, isNew: false, isReduced: false, onHold: false, sold: false, imageUrl: null,
});
const placeholderPieces: StorefrontPiece[] = [
  placeholder("meridian", "The Meridian", "Hand-wound · steel case", 35, 210),
  placeholder("aviator", "The Aviator", "Automatic · brushed steel", 130, 40),
  placeholder("regent", "The Regent", "Manual wind · gold-tone case", 260, 300),
  placeholder("wanderer", "The Wanderer", "Automatic · steel & leather", 15, 95),
  placeholder("compass", "The Compass", "Hand-wound · chronograph", 190, 250),
  placeholder("ledger", "The Ledger", "Automatic · steel case", 80, 340),
];

const PIECE_COLUMNS =
  "id, productName, brand, tags, photoUrls, status, priceCents, compareAtCents, reducedAt, createdAt";

type PieceRow = {
  id: string;
  productName: string;
  brand: string;
  tags: string[] | null;
  photoUrls: string[] | null;
  status: "AVAILABLE" | "HOLD" | "SOLD";
  priceCents: number | null;
  compareAtCents: number | null;
  reducedAt: string | null;
  createdAt: string;
};

type PriceBadges = { isNew: boolean; isReduced: boolean; compareAt: string | null };

// The badge rules, in one place:
//  New     — product created within the last 30 days.
//  Reduced — a reduction (original > current price) set within the last 30
//            days; only then is the original price shown struck through.
export function priceBadges(
  p: { createdAt: string; priceCents: number | null; compareAtCents: number | null; reducedAt: string | null },
  now: number = Date.now(),
): PriceBadges {
  const isNew = now - new Date(p.createdAt).getTime() <= BADGE_WINDOW_MS;
  const isReduced =
    p.compareAtCents != null &&
    p.priceCents != null &&
    p.compareAtCents > p.priceCents &&
    p.reducedAt != null &&
    now - new Date(p.reducedAt).getTime() <= BADGE_WINDOW_MS;
  return { isNew, isReduced, compareAt: isReduced ? formatPrice(p.compareAtCents) : null };
}

function toPiece(p: PieceRow, now: number): StorefrontPiece {
  const { hour, min } = anglesFromId(p.id);
  if (p.status === "SOLD") {
    // Sold: no price, no New/Reduced badges.
    return {
      id: p.id,
      name: p.productName,
      brand: p.brand,
      detail: p.tags?.length ? p.tags.slice(0, 2).join(" · ") : p.brand,
      price: "Sold",
      priceSet: false,
      compareAt: null,
      isNew: false,
      isReduced: false,
      onHold: false,
      sold: true,
      imageUrl: p.photoUrls?.[0] ?? null,
      hour,
      min,
    };
  }
  return {
    id: p.id,
    name: p.productName,
    brand: p.brand,
    detail: p.tags?.length ? p.tags.slice(0, 2).join(" · ") : p.brand,
    price: formatPrice(p.priceCents),
    priceSet: p.priceCents != null,
    imageUrl: p.photoUrls?.[0] ?? null,
    onHold: p.status === "HOLD",
    sold: false,
    hour,
    min,
    ...priceBadges(p, now),
  };
}

export type WatchDetail = {
  id: string;
  name: string;
  brand: string;
  status: "AVAILABLE" | "HOLD" | "SOLD";
  priceCents: number | null;
  descriptionHtml: string | null;
  tags: string[];
  photoUrls: string[];
  hour: number;
  min: number;
} & PriceBadges;

export async function getWatchDetail(id: string): Promise<WatchDetail | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, productName, brand, status, priceCents, compareAtCents, reducedAt, createdAt, descriptionHtml, tags, photoUrls",
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    const { hour, min } = anglesFromId(data.id);
    return {
      id: data.id,
      name: data.productName,
      brand: data.brand,
      status: data.status,
      priceCents: data.priceCents,
      descriptionHtml: data.descriptionHtml,
      tags: data.tags ?? [],
      photoUrls: data.photoUrls ?? [],
      hour,
      min,
      ...priceBadges(data),
    };
  } catch {
    return null;
  }
}

// Deterministic decorative clock-hand angles for products with no photo yet,
// derived from the product id so each card still looks distinct.
function anglesFromId(id: string): { hour: number; min: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return { hour: h, min: (h * 7) % 360 };
}

export type JournalPostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
};

export type JournalPost = JournalPostSummary & {
  bodyHtml: string | null;
};

export async function getPublishedPosts(): Promise<JournalPostSummary[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, excerpt, coverImageUrl, publishedAt")
      .eq("status", "PUBLISHED")
      .order("publishedAt", { ascending: false });

    if (error || !data) return [];
    return data as JournalPostSummary[];
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<JournalPost | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, excerpt, coverImageUrl, bodyHtml, publishedAt")
      .eq("slug", slug)
      .eq("status", "PUBLISHED")
      .maybeSingle();

    if (error || !data) return null;
    return data as JournalPost;
  } catch {
    return null;
  }
}


// Homepage row: pieces in stock, most valuable first (unpriced last).
export async function getShopRow(limit = 24): Promise<{ pieces: StorefrontPiece[]; total: number }> {
  if (!isSupabaseConfigured) return { pieces: placeholderPieces, total: placeholderPieces.length };

  try {
    const supabase = createPublicClient();
    const { data, error, count } = await supabase
      .from("products")
      .select(PIECE_COLUMNS, { count: "exact" })
      .in("status", ["AVAILABLE", "HOLD"])
      .order("priceCents", { ascending: false, nullsFirst: false })
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) return { pieces: placeholderPieces, total: placeholderPieces.length };
    const now = Date.now();
    return { pieces: data.map((p) => toPiece(p as PieceRow, now)), total: count ?? data.length };
  } catch {
    return { pieces: placeholderPieces, total: placeholderPieces.length };
  }
}

// "More from <brand>" under a product page. Falls back to the newest pieces
// when the brand has nothing else in stock, so the row is never empty.
export async function getRelatedPieces(
  brand: string,
  excludeId: string,
  limit = 4,
): Promise<{ pieces: StorefrontPiece[]; sameBrand: boolean }> {
  if (!isSupabaseConfigured) return { pieces: [], sameBrand: false };

  try {
    const supabase = createPublicClient();
    const base = () =>
      supabase
        .from("products")
        .select(PIECE_COLUMNS)
        .in("status", ["AVAILABLE", "HOLD"])
        .neq("id", excludeId)
        .order("createdAt", { ascending: false })
        .limit(limit);

    const now = Date.now();
    const { data: sameBrand } = await base().eq("brand", brand);
    if (sameBrand && sameBrand.length > 0) {
      return { pieces: sameBrand.map((p) => toPiece(p as PieceRow, now)), sameBrand: true };
    }

    const { data: latest } = await base();
    return { pieces: (latest ?? []).map((p) => toPiece(p as PieceRow, now)), sameBrand: false };
  } catch {
    return { pieces: [], sameBrand: false };
  }
}

export type BrandLink = { name: string; slug: string; count: number };

// Header "Watches" menu: every brand collection with at least one piece in
// stock, A→Z. products.brand mirrors the brand collection's name.
export async function getBrandMenu(): Promise<BrandLink[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = createPublicClient();
    const [{ data: brands }, { data: products }] = await Promise.all([
      supabase.from("collections").select("name, slug").eq("isBrand", true).order("name"),
      supabase.from("products").select("brand").in("status", ["AVAILABLE", "HOLD"]),
    ]);
    const counts = new Map<string, number>();
    for (const p of products ?? []) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
    return (brands ?? [])
      .map((b) => ({ name: b.name, slug: b.slug, count: counts.get(b.name) ?? 0 }))
      .filter((b) => b.count > 0);
  } catch {
    return [];
  }
}

export type CollectionPage = {
  name: string;
  slug: string;
  descriptionHtml: string | null;
  isBrand: boolean;
  pieces: StorefrontPiece[];
  total: number;
  page: number;
  pageCount: number;
};

export const COLLECTION_PAGE_SIZE = 24;

const STATUS_SETS: Record<StatusFilter, string[]> = {
  available: ["AVAILABLE", "HOLD"],
  sold: ["SOLD"],
  all: ["AVAILABLE", "HOLD", "SOLD"],
};

// /collections/[slug] — a brand, themed or automated collection, or "all",
// with the shared filter bar: status (available / sold / all), on sale, and
// sort (price, date, most loved). 24 per page.
export async function getCollectionPage(slug: string, q: CollectionQuery): Promise<CollectionPage | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = createPublicClient();
    const statuses = STATUS_SETS[q.status];
    let meta: Omit<CollectionPage, "pieces" | "total" | "page" | "pageCount">;
    let rows: PieceRow[];

    const byStatus = async (ids?: string[]) => {
      let query = supabase.from("products").select(PIECE_COLUMNS).in("status", statuses).limit(2000);
      if (ids) query = query.in("id", ids);
      const { data } = await query;
      return (data ?? []) as PieceRow[];
    };

    if (slug === "all") {
      meta = { name: "All watches", slug, descriptionHtml: null, isBrand: false };
      rows = await byStatus();
    } else {
      const { data: c } = await supabase
        .from("collections")
        .select("id, name, slug, description, isBrand, isSmart, matchAll, rules, excludeRules")
        .eq("slug", slug)
        .maybeSingle();
      if (!c) return null;
      meta = { name: c.name, slug: c.slug, descriptionHtml: c.description, isBrand: c.isBrand };

      if (c.isSmart) {
        // Automated collections are evaluated at read time, same rules as admin.
        const now = Date.now();
        rows = (await byStatus()).filter((p) =>
          matchesCollection(
            { ...p, tags: p.tags ?? [] },
            { rules: (c.rules ?? []) as Rule[], excludeRules: (c.excludeRules ?? []) as Rule[], matchAll: c.matchAll },
            now,
          ),
        );
      } else {
        const { data: links } = await supabase.from("watch_collections").select("watchId").eq("collectionId", c.id);
        const ids = (links ?? []).map((l) => l.watchId);
        rows = ids.length === 0 ? [] : await byStatus(ids);
      }
    }

    const now = Date.now();
    let pieces = rows.map((r) => ({ row: r, piece: toPiece(r, now) }));
    if (q.sale) pieces = pieces.filter((x) => x.piece.isReduced);

    let saves = new Map<string, number>();
    if (q.sort === "popular") {
      const { data } = await supabase.rpc("product_save_counts");
      saves = new Map(((data ?? []) as { watchId: string; saves: number }[]).map((r) => [r.watchId, Number(r.saves)]));
    }
    const price = (r: PieceRow) => r.priceCents;
    const created = (r: PieceRow) => new Date(r.createdAt).getTime();
    pieces.sort((a, b) => {
      const A = a.row, B = b.row;
      switch (q.sort) {
        case "price-asc":
        case "price-desc": {
          // Unpriced pieces always last, whichever direction.
          if (price(A) == null && price(B) == null) return created(B) - created(A);
          if (price(A) == null) return 1;
          if (price(B) == null) return -1;
          return q.sort === "price-asc" ? price(A)! - price(B)! : price(B)! - price(A)!;
        }
        case "newest":
          return created(B) - created(A);
        case "oldest":
          return created(A) - created(B);
        case "popular":
          return (saves.get(B.id) ?? 0) - (saves.get(A.id) ?? 0) || created(B) - created(A);
      }
    });

    const total = pieces.length;
    const pageCount = Math.max(1, Math.ceil(total / COLLECTION_PAGE_SIZE));
    const current = Math.min(q.page, pageCount);
    return {
      ...meta,
      pieces: pieces.slice((current - 1) * COLLECTION_PAGE_SIZE, current * COLLECTION_PAGE_SIZE).map((x) => x.piece),
      total,
      page: current,
      pageCount,
    };
  } catch {
    return null;
  }
}

// Every brand collection name (in stock or not) — suggestions for the
// Watch Sourcing brand field.
export async function getAllBrandNames(): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from("collections").select("name").eq("isBrand", true).order("name");
    return (data ?? []).map((b) => b.name);
  } catch {
    return [];
  }
}
