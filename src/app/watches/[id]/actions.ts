"use server";

import { createClient } from "@/lib/supabase/server";
import { getCustomer } from "@/lib/customer";
import { revalidatePath } from "next/cache";
import { sendDepositInstructions, sendDepositNotification, sendOrderNotification } from "@/lib/email";
import { getShopSettings } from "@/lib/deposits";

export type SubmitOrderState = {
  status: "idle" | "success" | "error";
  message?: string;
};

// Request-to-buy. Requires a signed-in customer with a complete profile;
// name/email/phone come from that profile, not from the form, so a request
// always belongs to (and is reachable through) a real, confirmed account.
export async function submitOrder(
  watchId: string,
  _prevState: SubmitOrderState,
  formData: FormData,
): Promise<SubmitOrderState> {
  const customer = await getCustomer();
  if (customer.status === "signed-out") {
    return { status: "error", message: "Please sign in to request this piece." };
  }
  if (customer.status === "incomplete") {
    return { status: "error", message: "Please add your phone and address first." };
  }
  const { profile } = customer;
  const message = String(formData.get("message") ?? "").trim();

  const supabase = await createClient();
  const { data: watch } = await supabase
    .from("products")
    .select("productName, status")
    .eq("id", watchId)
    .maybeSingle();

  if (!watch || watch.status !== "AVAILABLE") {
    return { status: "error", message: "This piece is no longer available." };
  }

  // Customers can't read orders back beyond their own, so the id is
  // generated here and sent explicitly rather than selected after insert.
  const orderId = crypto.randomUUID();
  const { error } = await supabase.from("orders").insert({
    id: orderId,
    watchId,
    userId: profile.userId,
    customerName: profile.name,
    customerEmail: profile.email,
    customerPhone: profile.phone,
    message: message || null,
  });

  if (error) {
    return { status: "error", message: "Something went wrong — please try again, or reach us directly." };
  }

  await sendOrderNotification({
    watchTitle: watch.productName,
    customerName: profile.name!,
    customerEmail: profile.email,
    customerPhone: profile.phone,
    message: message || null,
    orderId,
  });

  return { status: "success" };
}

export type SubmitDepositState = {
  status: "idle" | "success" | "error";
  message?: string;
  amountCents?: number;
  holdDays?: number;
  paymentInstructions?: string | null;
};

// Deposit-to-hold request. The amount (price × deposit %) is fixed by a DB
// trigger, not the client; the watch only goes ON HOLD once the owner
// confirms the payment in /admin/deposits.
export async function submitDeposit(
  watchId: string,
  _prev: SubmitDepositState,
  formData: FormData,
): Promise<SubmitDepositState> {
  const customer = await getCustomer();
  if (customer.status === "signed-out") return { status: "error", message: "Please sign in to place a deposit." };
  if (customer.status === "incomplete") return { status: "error", message: "Please add your phone and address first." };
  const { profile } = customer;
  const message = String(formData.get("message") ?? "").trim();

  const supabase = await createClient();
  const [{ data: watch }, settings] = await Promise.all([
    supabase.from("products").select("productName").eq("id", watchId).maybeSingle(),
    getShopSettings(),
  ]);

  const { data, error } = await supabase
    .from("deposit_requests")
    .insert({
      watchId,
      userId: profile.userId,
      amountCents: 1, // replaced by the DB trigger
      percent: 0, // replaced by the DB trigger
      contactName: profile.name,
      contactEmail: profile.email,
      contactPhone: profile.phone,
      message: message || null,
    })
    .select("id, amountCents, percent")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "You already have a deposit request open for this piece — check your email or account." };
    }
    if (/no longer|no price/i.test(error.message)) return { status: "error", message: error.message };
    return { status: "error", message: "Something went wrong — please try again, or reach us directly." };
  }

  const title = watch?.productName ?? "watch";
  await Promise.all([
    sendDepositNotification({
      id: data.id,
      watchTitle: title,
      amountCents: data.amountCents,
      percent: data.percent,
      customerName: profile.name!,
      customerEmail: profile.email,
      customerPhone: profile.phone,
      message: message || null,
    }),
    sendDepositInstructions({
      to: profile.email,
      customerName: profile.name!,
      watchTitle: title,
      amountCents: data.amountCents,
      holdDays: settings.holdDays,
      paymentInstructions: settings.paymentInstructions,
    }),
  ]);

  revalidatePath("/account");
  return {
    status: "success",
    amountCents: data.amountCents,
    holdDays: settings.holdDays,
    paymentInstructions: settings.paymentInstructions,
  };
}
