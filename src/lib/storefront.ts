import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatPrice } from "@/lib/admin/types";

export type StorefrontPiece = {
  id: string;
  name: string;
  detail: string;
  price: string;
  imageUrl: string | null;
  hour: number;
  min: number;
};

// Shown until the owner publishes real products in /admin/products.
const placeholderPieces: StorefrontPiece[] = [
  { id: "meridian", name: "The Meridian", detail: "Hand-wound · steel case", price: "Price on request", imageUrl: null, hour: 35, min: 210 },
  { id: "aviator", name: "The Aviator", detail: "Automatic · brushed steel", price: "Price on request", imageUrl: null, hour: 130, min: 40 },
  { id: "regent", name: "The Regent", detail: "Manual wind · gold-tone case", price: "Price on request", imageUrl: null, hour: 260, min: 300 },
  { id: "wanderer", name: "The Wanderer", detail: "Automatic · steel & leather", price: "Price on request", imageUrl: null, hour: 15, min: 95 },
  { id: "compass", name: "The Compass", detail: "Hand-wound · chronograph", price: "Price on request", imageUrl: null, hour: 190, min: 250 },
  { id: "ledger", name: "The Ledger", detail: "Automatic · steel case", price: "Price on request", imageUrl: null, hour: 80, min: 340 },
];

export type WatchDetail = {
  id: string;
  name: string;
  brand: string;
  status: "AVAILABLE" | "SOLD";
  descriptionHtml: string | null;
  tags: string[];
  photoUrls: string[];
  hour: number;
  min: number;
};

export async function getWatchDetail(id: string): Promise<WatchDetail | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("watches")
      .select("id, productName, brand, status, descriptionHtml, tags, photoUrls")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    const { hour, min } = anglesFromId(data.id);
    return {
      id: data.id,
      name: data.productName,
      brand: data.brand,
      status: data.status,
      descriptionHtml: data.descriptionHtml,
      tags: data.tags ?? [],
      photoUrls: data.photoUrls ?? [],
      hour,
      min,
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

export async function getFeaturedPieces(): Promise<StorefrontPiece[]> {
  if (!isSupabaseConfigured) return placeholderPieces;

  try {
    const supabase = createPublicClient();
    // anon is column-restricted (see Bussiness Report/prisma/rls/0001_public_catalog_access.sql)
    // to exactly these public-safe columns — business fields aren't reachable here.
    const { data, error } = await supabase
      .from("watches")
      .select("id, productName, brand, tags, photoUrls, status, createdAt")
      .eq("status", "AVAILABLE")
      .order("createdAt", { ascending: false })
      .limit(6);

    if (error || !data || data.length === 0) return placeholderPieces;

    return data.map((p) => {
      const { hour, min } = anglesFromId(p.id);
      return {
        id: p.id,
        name: p.productName,
        detail: p.tags?.length ? p.tags.slice(0, 2).join(" · ") : p.brand,
        price: formatPrice(),
        imageUrl: p.photoUrls?.[0] ?? null,
        hour,
        min,
      };
    });
  } catch {
    return placeholderPieces;
  }
}
