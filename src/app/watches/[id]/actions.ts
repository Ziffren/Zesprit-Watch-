"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { sendOrderNotification } from "@/lib/email";

export type SubmitOrderState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitOrder(
  watchId: string,
  _prevState: SubmitOrderState,
  formData: FormData
): Promise<SubmitOrderState> {
  // Honeypot — real visitors never fill this (it's visually hidden). Bots
  // that fill every field do. Pretend success so they don't learn to skip it.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { status: "success" };
  }

  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!customerName || !customerEmail) {
    return { status: "error", message: "Name and email are required." };
  }
  if (!emailPattern.test(customerEmail)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  // If a customer is logged in, submit through their own session (cookie
  // client) so the order can be linked to their account — only the
  // `authenticated` role is granted the "userId" column, not anon. Guests
  // (no session) keep using the plain anon client, unchanged.
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  const supabase = user ? sessionClient : createPublicClient();

  const { data: watch } = await supabase
    .from("products")
    .select("productName, status")
    .eq("id", watchId)
    .maybeSingle();

  if (!watch || watch.status !== "AVAILABLE") {
    return { status: "error", message: "This piece is no longer available." };
  }

  // Neither role can read rows back (orders RLS has no customer/anon SELECT
  // beyond "own orders"), so the id is generated here and sent explicitly
  // rather than selected after insert.
  const orderId = crypto.randomUUID();
  const { error } = await supabase.from("orders").insert({
    id: orderId,
    watchId,
    // Only included when logged in — anon isn't granted this column at
    // all, and explicitly sending `userId: null` would still trip that
    // grant check (Postgres cares whether the column is referenced, not
    // its value).
    ...(user ? { userId: user.id } : {}),
    customerName,
    customerEmail,
    customerPhone: customerPhone || null,
    message: message || null,
  });

  if (error) {
    return {
      status: "error",
      message: "Something went wrong — please try again, or reach us directly.",
    };
  }

  await sendOrderNotification({
    watchTitle: watch.productName,
    customerName,
    customerEmail,
    customerPhone: customerPhone || null,
    message: message || null,
    orderId,
  });

  return { status: "success" };
}
