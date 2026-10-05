"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { sendMessageNotification } from "@/lib/email";

export type SubmitMessageState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitMessage(
  _prevState: SubmitMessageState,
  formData: FormData
): Promise<SubmitMessageState> {
  // Honeypot — see watches/[id]/actions.ts for why this is a plain (CSS-hidden)
  // field rather than type="hidden".
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { status: "success" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { status: "error", message: "Name, email, and a message are required." };
  }
  if (!emailPattern.test(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  const supabase = user ? sessionClient : createPublicClient();

  const messageId = crypto.randomUUID();
  const { error } = await supabase.from("messages").insert({
    id: messageId,
    name,
    email,
    phone: phone || null,
    message,
    ...(user ? { userId: user.id } : {}),
  });

  if (error) {
    return {
      status: "error",
      message: "Something went wrong — please try again, or email us directly.",
    };
  }

  await sendMessageNotification({ name, email, phone: phone || null, message, messageId });

  return { status: "success" };
}
