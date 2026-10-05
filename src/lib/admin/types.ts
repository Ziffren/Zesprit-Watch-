// Mirrors the shared `watches` / `collections` / `watch_collections` /
// `orders` tables owned by the Watch Report app (prisma/schema.prisma in
// /Users/phamhiendz/Bussiness Report). Field names are the exact Postgres
// column names Prisma created (camelCase, unmapped) so there's no
// translation layer between this file and what Supabase/PostgREST returns.
//
// This app only ever reads/writes the catalog columns (productName, brand,
// descriptionHtml, tags, photoUrls) — never the business columns
// (purchasePrice, servicePrice, salePrice, customerInfo, etc.), which stay
// owned by the Watch Report admin. `status` is shown read-only here; it's
// only ever changed in Watch Report, tied to real sale data.

export type WatchStatus = "AVAILABLE" | "SOLD";

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  createdAt: string;
};

export type Product = {
  id: string;
  productName: string;
  brand: string;
  status: WatchStatus;
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

// There is no public list-price field in the shared schema — purchase/sale
// prices are business-internal (Watch Report only) and never exposed here.
// Every catalogue item is deliberately "Price on request", matching the
// storefront's existing concierge voice.
export function formatPrice(): string {
  return "Price on request";
}
