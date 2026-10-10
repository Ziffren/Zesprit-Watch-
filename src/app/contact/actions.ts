"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { getCustomer } from "@/lib/customer";
import { sendMessageNotification } from "@/lib/email";

export type SubmitMessageState = {
  status: "idle" | "success" | "error";
  message?: string;
  email?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

// "Message Me" / Contact. Signed-in customers send under their account
// (details from their profile); guests type their name and email. Either
// way it lands in Admin → Messages and emails the owner.
export async function submitMessage(_prev: SubmitMessageState, formData: FormData): Promise<SubmitMessageState> {
  // Bot traps: a hidden field real people never fill, and forms submitted
  // faster than a person could type. Pretend success so bots don't adapt.
  if (text(formData.get("company"), 200) !== "") return { status: "success" };
  const startedAt = Number(formData.get("startedAt"));
  if (Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < 2500) return { status: "success" };

  const message = text(formData.get("message"), 5000);
  if (!message) return { status: "error", message: "Write your message first." };

  const customer = await getCustomer();
  let name: string;
  let email: string;
  let phone: string | null;
  let userId: string | null = null;

  if (customer.status === "signed-out") {
    name = text(formData.get("name"), 120);
    email = text(formData.get("email"), 200).toLowerCase();
    phone = text(formData.get("phone"), 40) || null;
    if (!name) return { status: "error", message: "Enter your name." };
    if (!emailPattern.test(email)) return { status: "error", message: "Enter a valid email so we can reply." };
  } else {
    const p = customer.profile;
    userId = p.userId;
    name = p.name || text(formData.get("name"), 120) || p.email;
    email = p.email;
    phone = p.phone || text(formData.get("phone"), 40) || null;
  }

  const supabase = userId ? await createClient() : createPublicClient();
  const messageId = crypto.randomUUID();
  const { error } = await supabase.from("messages").insert({
    id: messageId,
    name,
    email,
    phone,
    message,
    ...(userId ? { userId } : {}),
  });
  if (error) return { status: "error", message: "Something went wrong — please try again." };

  await sendMessageNotification({ name, email, phone, message, messageId });
  return { status: "success", email };
}
