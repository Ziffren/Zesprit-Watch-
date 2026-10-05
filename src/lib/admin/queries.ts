import { createClient } from "@/lib/supabase/server";
import type {
  Collection,
  CustomerWithCounts,
  CustomerWithDetails,
  OrderStatus,
  OrderWithWatch,
  ProductWithRelations,
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
    .from("watches")
    .select(
      "id, productName, brand, status, descriptionHtml, tags, photoUrls, createdAt, updatedAt, watch_collections(collectionId)"
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
    .from("watches")
    .select(
      "id, productName, brand, status, descriptionHtml, tags, photoUrls, createdAt, updatedAt, watch_collections(collectionId)",
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
  purchasedThisMonth: number;
  soldThisMonth: number;
};

export async function getProductStats(): Promise<ProductStats> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    .toISOString()
    .slice(0, 10);

  const [inStock, purchased, sold] = await Promise.all([
    supabase.from("watches").select("id", { count: "exact", head: true }).eq("status", "AVAILABLE"),
    supabase
      .from("watches")
      .select("id", { count: "exact", head: true })
      .gte("purchaseDate", monthStart)
      .lt("purchaseDate", nextMonthStart),
    supabase
      .from("watches")
      .select("id", { count: "exact", head: true })
      .gte("soldDate", monthStart)
      .lt("soldDate", nextMonthStart),
  ]);

  return {
    inStock: inStock.count ?? 0,
    purchasedThisMonth: purchased.count ?? 0,
    soldThisMonth: sold.count ?? 0,
  };
}

export async function getProduct(id: string): Promise<ProductWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("watches")
    .select(
      "id, productName, brand, status, descriptionHtml, tags, photoUrls, createdAt, updatedAt, watch_collections(collectionId)"
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
    .select("*, watches(id, productName, brand)", { count: "exact" })
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
    .select("*, watches(id, productName, brand)")
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
      "*, saved_watches(createdAt, watches(id, productName, brand)), orders(*, watches(id, productName, brand))"
    )
    .eq("userId", userId)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load customer: ${error.message}`);
  return data as unknown as CustomerWithDetails | null;
}
