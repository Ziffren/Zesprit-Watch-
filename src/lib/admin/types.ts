// Mirrors tables owned by the shared Supabase project (prisma/schema.prisma
// in /Users/phamhiendz/Bussiness Report). Field names are the exact
// Postgres column names Prisma created (camelCase, unmapped) so there's no
// translation layer between this file and what Supabase/PostgREST returns.
//
// `products`/`collections`/`watch_collections` are fully owned by this app
// (full CRUD from /admin) — independent of Watch Report's own `watches`
// table since the 2026-10-05 split. `priceCents` is this app's own public
// asking price, unrelated to Watch Report's purchase/sale price data.

export type WatchStatus = "AVAILABLE" | "SOLD";

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  isBrand: boolean;
  createdAt: string;
};

export type Product = {
  id: string;
  productName: string;
  brand: string;
  status: WatchStatus;
  priceCents: number | null;
  descriptionHtml: string | null;
  tags: string[];
  photoUrls: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProductWithRelations = Product & {
  watch_collections: { collectionId: string }[];
};

export type OrderStatus = "PENDING" | "CONFIRMED" | "FULFILLED" | "CANCELLED";

export type Order = {
  id: string;
  watchId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  message: string | null;
  status: OrderStatus;
  source: string;
  agreedPriceCents: number | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderWithWatch = Order & {
  watches: Pick<Product, "id" | "productName" | "brand"> | null;
};

export type Customer = {
  userId: string;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
};

export type CustomerWithCounts = Customer & {
  saved_watches: { watchId: string }[];
  orders: { id: string }[];
};

export type CustomerWithDetails = Customer & {
  saved_watches: { createdAt: string; watches: Pick<Product, "id" | "productName" | "brand"> | null }[];
  orders: OrderWithWatch[];
};

export type PostStatus = "DRAFT" | "PUBLISHED";

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  bodyHtml: string | null;
  coverImageUrl: string | null;
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnalyticsOverview = {
  totalVisits30d: number;
  uniqueVisitors30d: number;
  liveNow: number;
  returningVisitors30d: number;
  totalRevenueCents: number;
  ordersCount: number;
};

export type DailyTraffic = {
  day: string;
  views: number;
  visitors: number;
};

export type TopViewedProduct = {
  watchId: string;
  productName: string;
  brand: string;
  views: number;
};

export type LocationStat = {
  country: string;
  region: string | null;
  city: string | null;
  visitors: number;
};

export type MapPoint = {
  latitude: number;
  longitude: number;
  city: string | null;
  country: string;
  visitors: number;
  liveVisitors: number;
};

export type DeviceStat = {
  device: string;
  visitors: number;
};

export type TopCustomer = {
  userId: string;
  name: string | null;
  email: string;
  totalCents: number;
  orderCount: number;
};

export type MessageStatus = "UNREAD" | "READ";

export type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: MessageStatus;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function formatCents(cents: number | null): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Public storefront price display. A product with no priceCents set still
// shows "Price on request" (the original concierge voice), now as a
// fallback rather than the only option.
export function formatPrice(cents: number | null): string {
  if (cents == null) return "Price on request";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
