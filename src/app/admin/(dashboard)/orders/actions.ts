"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createOrder(formData: FormData) {
  const supabase = await createClient();

  const watchId = String(formData.get("watchId") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const status = String(formData.get("status") ?? "CONFIRMED");
  const priceRaw = String(formData.get("agreedPrice") ?? "").trim();

  if (!watchId) throw new Error("Pick a watch.");
  if (!customerName || !customerEmail) throw new Error("Customer name and email are required.");

  const agreedPriceCents = priceRaw ? Math.round(parseFloat(priceRaw) * 100) : null;

  const { data, error } = await supabase
    .from("orders")
    .insert({
      watchId,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      message: message || null,
      status,
      source: "manual",
      agreedPriceCents,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${data.id}`);
}

export async function updateOrder(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "PENDING");
  const priceRaw = String(formData.get("agreedPrice") ?? "").trim();
  if (!id) throw new Error("Missing order id.");

  const agreedPriceCents = priceRaw ? Math.round(parseFloat(priceRaw) * 100) : null;

  const { error } = await supabase
    .from("orders")
    .update({ status, agreedPriceCents })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}`);
}
