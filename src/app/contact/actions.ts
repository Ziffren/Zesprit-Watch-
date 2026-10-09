"use server";

import { createClient } from "@/lib/supabase/server";
import { getCustomer } from "@/lib/customer";
import { sendMessageNotification } from "@/lib/email";

export type SubmitMessageState = {
  status: "idle" | "success" | "error";
  message?: string;
};

// Contact message. Requires a signed-in customer with a complete profile —
// the sender's name/email/phone come from their account.
export async function submitMessage(_prevState: SubmitMessageState, formData: FormData): Promise<SubmitMessageState> {
  const customer = await getCustomer();
  if (customer.status === "signed-out") return { status: "error", message: "Please sign in to send a message." };
  if (customer.status === "incomplete") return { status: "error", message: "Please add your phone and address first." };
  const { profile } = customer;

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { status: "error", message: "Write a message first." };

  const supabase = await createClient();
  const messageId = crypto.randomUUID();
  const { error } = await supabase.from("messages").insert({
    id: messageId,
    userId: profile.userId,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    message,
  });

  if (error) {
    return { status: "error", message: "Something went wrong — please try again, or email us directly." };
  }

  await sendMessageNotification({ name: profile.name!, email: profile.email, phone: profile.phone, message, messageId });
  return { status: "success" };
}
