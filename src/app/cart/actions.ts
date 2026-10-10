"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCustomer } from "@/lib/customer";
import { formatPrice } from "@/lib/admin/types";
import { sendCartNotification } from "@/lib/email";

export type CheckoutState = { status: "idle" | "success" | "error"; message?: string; count?: number };

// Sends one purchase request covering every available piece in the cart:
// an order per watch (so each can be handled in Admin → Orders), one email
// to the owner, and those pieces leave the cart.
export async function checkoutCart(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const customer = await getCustomer();
  if (customer.status === "signed-out") return { status: "error", message: "Please sign in first." };
  if (customer.status === "incomplete") return { status: "error", message: "Please add your phone and address first." };
  const { profile } = customer;
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000) || null;

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("cart_items")
    .select("watchId, product:products(id, productName, status, priceCents)")
    .eq("userId", profile.userId);
  type Item = { watchId: string; product: { id: string; productName: string; status: string; priceCents: number | null } | null };
  const available = ((items ?? []) as unknown as Item[]).filter((i) => i.product?.status === "AVAILABLE");
  if (available.length === 0) return { status: "error", message: "Nothing in your cart is available any more." };

  const rows = available.map((i) => ({
    id: crypto.randomUUID(),
    watchId: i.watchId,
    userId: profile.userId,
    customerName: profile.name,
    customerEmail: profile.email,
    customerPhone: profile.phone,
    message: [note, available.length > 1 ? `(Cart request — ${available.length} watches together)` : null].filter(Boolean).join("\n\n") || null,
  }));
  const { error } = await supabase.from("orders").insert(rows);
  if (error) return { status: "error", message: "Something went wrong — please try again." };

  await supabase
    .from("cart_items")
    .delete()
    .eq("userId", profile.userId)
    .in("watchId", available.map((i) => i.watchId));

  await sendCartNotification({
    customerName: profile.name!,
    customerEmail: profile.email,
    customerPhone: profile.phone,
    note,
    items: rows.map((r, idx) => ({ orderId: r.id, title: available[idx].product!.productName, price: formatPrice(available[idx].product!.priceCents) })),
  });

  revalidatePath("/cart");
  revalidatePath("/account");
  return { status: "success", count: rows.length };
}
