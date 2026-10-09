"use server";

import { createClient } from "@/lib/supabase/server";
import { getCustomer } from "@/lib/customer";
import { sendOrderNotification } from "@/lib/email";

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
