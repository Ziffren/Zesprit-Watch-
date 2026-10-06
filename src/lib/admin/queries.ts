import { createClient } from "@/lib/supabase/server";
import type {
  AnalyticsOverview,
  Collection,
  CustomerWithCounts,
  CustomerWithDetails,
  DailyTraffic,
  DeviceStat,
  LocationStat,
  MapPoint,
  Message,
  MessageStatus,
  OrderStatus,
  OrderWithWatch,
  Post,
  PostStatus,
  ProductWithRelations,
  TopCustomer,
  TopViewedProduct,
} from "./types";

export async function listCollections(): Promise<
  (Collection & { product_count: number })[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*, watch_collections(count)")
    .order("name");

  if (error) throw new Error(`Couldn't load collections: ${error.message}`);

  return (data ?? []).map((row) => ({
    ...row,
    product_count: row.watch_collections?.[0]?.count ?? 0,
  })) as (Collection & { product_count: number })[];
}

export async function getCollection(id: string): Promise<Collection | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load collection: ${error.message}`);
  return data as Collection | null;
}

// Full, unpaginated list — used by the "assign to collection" checklist,
// which needs every watch available to pick from.
export async function listProducts(): Promise<ProductWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, productName, brand, status, priceCents, descriptionHtml, tags, photoUrls, createdAt, updatedAt, watch_collections(collectionId)"
    )
    .order("status", { ascending: true })
    .order("updatedAt", { ascending: false });

  if (error) throw new Error(`Couldn't load products: ${error.message}`);
  return (data ?? []) as unknown as ProductWithRelations[];
}

export type ProductListPage = {
  products: ProductWithRelations[];
  total: number;
  page: number;
  pageSize: number;
};

// Paginated + searchable list for the main /admin/products table. Sorted
// AVAILABLE before SOLD (status ascending — "AVAILABLE" < "SOLD"
// alphabetically), newest-updated first within each group.
export async function listProductsPage({
  page = 1,
  pageSize = 50,
  q,
}: {
  page?: number;
  pageSize?: number;
  q?: string;
} = {}): Promise<ProductListPage> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select(
      "id, productName, brand, status, priceCents, descriptionHtml, tags, photoUrls, createdAt, updatedAt, watch_collections(collectionId)",
      { count: "exact" }
    )
    .order("status", { ascending: true })
    .order("updatedAt", { ascending: false })
    .range(from, to);

  const term = q?.trim().replace(/[,()%]/g, "");
  if (term) {
    query = query.or(`productName.ilike.%${term}%,brand.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`Couldn't load products: ${error.message}`);

  return {
    products: (data ?? []) as unknown as ProductWithRelations[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export type ProductStats = {
  inStock: number;
  addedThisMonth: number;
};

// Only `inStock`/`addedThisMonth` — this app no longer has purchase/sale
// date data (that's Watch Report's own business ledger now, a fully
// separate table as of 2026-10-05). "Added this month" is based on this
// catalogue's own createdAt, the closest honest equivalent.
export async function getProductStats(): Promise<ProductStats> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const [inStock, added] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "AVAILABLE"),
    supabase.from("products").select("id", { count: "exact", head: true }).gte("createdAt", monthStart),
  ]);

  return {
    inStock: inStock.count ?? 0,
    addedThisMonth: added.count ?? 0,
  };
}

export async function getProduct(id: string): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, productName, brand, status, priceCents, descriptionHtml, tags, photoUrls, createdAt, updatedAt, watch_collections(collectionId)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load product: ${error.message}`);
  return data as unknown as ProductWithRelations | null;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type OrderListPage = {
  orders: OrderWithWatch[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listOrdersPage({
  page = 1,
  pageSize = 50,
  q,
  status,
}: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: OrderStatus;
} = {}): Promise<OrderListPage> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("orders")
    .select("*, watches:products(id, productName, brand)", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);

  const term = q?.trim().replace(/[,()%]/g, "");
  if (term) {
    query = query.or(`customerName.ilike.%${term}%,customerEmail.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`Couldn't load orders: ${error.message}`);

  return {
    orders: (data ?? []) as unknown as OrderWithWatch[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getOrderCounts(): Promise<Record<OrderStatus, number>> {
  const supabase = await createClient();
  const statuses: OrderStatus[] = ["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"];
  const results = await Promise.all(
    statuses.map((s) =>
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", s)
    )
  );
  return statuses.reduce(
    (acc, s, i) => ({ ...acc, [s]: results[i].count ?? 0 }),
    {} as Record<OrderStatus, number>
  );
}

export async function getOrder(id: string): Promise<OrderWithWatch | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, watches:products(id, productName, brand)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load order: ${error.message}`);
  return data as unknown as OrderWithWatch | null;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export type CustomerListPage = {
  customers: CustomerWithCounts[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listCustomersPage({
  page = 1,
  pageSize = 50,
  q,
}: {
  page?: number;
  pageSize?: number;
  q?: string;
} = {}): Promise<CustomerListPage> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("customer_profiles")
    .select("*, saved_watches(watchId), orders(id)", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(from, to);

  const term = q?.trim().replace(/[,()%]/g, "");
  if (term) {
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`Couldn't load customers: ${error.message}`);

  return {
    customers: (data ?? []) as unknown as CustomerWithCounts[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getCustomer(userId: string): Promise<CustomerWithDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_profiles")
    .select(
      "*, saved_watches(createdAt, watches:products(id, productName, brand)), orders(*, watches:products(id, productName, brand))"
    )
    .eq("userId", userId)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load customer: ${error.message}`);
  return data as unknown as CustomerWithDetails | null;
}

// ---------------------------------------------------------------------------
// Content (Journal posts)
// ---------------------------------------------------------------------------

export type PostListPage = {
  posts: Post[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listPostsPage({
  page = 1,
  pageSize = 50,
  q,
  status,
}: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: PostStatus;
} = {}): Promise<PostListPage> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("posts")
    .select("*", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);

  const term = q?.trim().replace(/[,()%]/g, "");
  if (term) {
    query = query.ilike("title", `%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`Couldn't load posts: ${error.message}`);

  return {
    posts: (data ?? []) as Post[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getPost(id: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Couldn't load post: ${error.message}`);
  return data as Post | null;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_analytics_overview").single();
  if (error) throw new Error(`Couldn't load analytics overview: ${error.message}`);
  return data as AnalyticsOverview;
}

export async function getDailyTraffic(days = 30): Promise<DailyTraffic[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("analytics_daily_traffic")
    .select("day, views, visitors")
    .gte("day", since.toISOString().slice(0, 10))
    .order("day", { ascending: true });
  if (error) throw new Error(`Couldn't load traffic: ${error.message}`);

  // Fill in zero-days so the chart doesn't skip gaps where nobody visited.
  const byDay = new Map((data ?? []).map((d) => [d.day, d as DailyTraffic]));
  const series: DailyTraffic[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push(byDay.get(key) ?? { day: key, views: 0, visitors: 0 });
  }
  return series;
}

export async function getTopViewedProducts(limit = 8): Promise<TopViewedProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analytics_top_products")
    .select("*")
    .limit(limit);
  if (error) throw new Error(`Couldn't load top products: ${error.message}`);
  return (data ?? []) as TopViewedProduct[];
}

export async function getSessionLocations(limit = 8): Promise<LocationStat[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("analytics_locations").select("*").limit(limit);
  if (error) throw new Error(`Couldn't load session locations: ${error.message}`);
  return (data ?? []) as LocationStat[];
}

export async function getMapPoints(): Promise<MapPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("analytics_map_points").select("*").limit(200);
  if (error) throw new Error(`Couldn't load map points: ${error.message}`);
  // numeric columns come back from PostgREST as strings
  return (data ?? []).map((p) => ({
    ...p,
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
    visitors: Number(p.visitors),
    liveVisitors: Number(p.liveVisitors),
  })) as MapPoint[];
}

export async function getDeviceStats(): Promise<DeviceStat[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("analytics_devices").select("*");
  if (error) throw new Error(`Couldn't load device stats: ${error.message}`);
  return (data ?? []) as DeviceStat[];
}

export async function getTopCustomersBySpend(limit = 8): Promise<TopCustomer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("analytics_top_customers").select("*").limit(limit);
  if (error) throw new Error(`Couldn't load top customers: ${error.message}`);
  return (data ?? []) as TopCustomer[];
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export type MessageListPage = {
  messages: Message[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listMessagesPage({
  page = 1,
  pageSize = 50,
  q,
  status,
}: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: MessageStatus;
} = {}): Promise<MessageListPage> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("messages")
    .select("*", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);

  const term = q?.trim().replace(/[,()%]/g, "");
  if (term) {
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`Couldn't load messages: ${error.message}`);

  return {
    messages: (data ?? []) as Message[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getUnreadMessageCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "UNREAD");
  return count ?? 0;
}

export async function getMessage(id: string): Promise<Message | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("messages").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Couldn't load message: ${error.message}`);
  return data as Message | null;
}
