import { createClient } from "@/lib/supabase/server";

export type SavedWatchEntry = {
  createdAt: string;
  watches: {
    id: string;
    productName: string;
    brand: string;
    photoUrls: string[];
    status: "AVAILABLE" | "SOLD";
  } | null;
};

export type CustomerOrderEntry = {
  id: string;
  status: string;
  createdAt: string;
  watches: { id: string; productName: string; brand: string } | null;
};

export type CustomerAccount = {
  userId: string;
  email: string;
  name: string | null;
  phone: string | null;
  saved: SavedWatchEntry[];
  orders: CustomerOrderEntry[];
};

export async function getCustomerAccount(): Promise<CustomerAccount | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: saved }, { data: orders }] = await Promise.all([
    supabase.from("customer_profiles").select("*").eq("userId", user.id).maybeSingle(),
    supabase
      .from("saved_watches")
      .select("createdAt, watches(id, productName, brand, photoUrls, status)")
      .eq("userId", user.id)
      .order("createdAt", { ascending: false }),
    supabase
      .from("orders")
      .select("id, status, createdAt, watches(id, productName, brand)")
      .eq("userId", user.id)
      .order("createdAt", { ascending: false }),
  ]);

  return {
    userId: user.id,
    email: profile?.email ?? user.email ?? "",
    name: profile?.name ?? null,
    phone: profile?.phone ?? null,
    saved: (saved ?? []) as unknown as SavedWatchEntry[],
    orders: (orders ?? []) as unknown as CustomerOrderEntry[],
  };
}
