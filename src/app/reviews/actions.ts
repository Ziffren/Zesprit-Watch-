"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCustomer } from "@/lib/customer";
import { sendReviewNotification } from "@/lib/email";
import { CRITERIA, publicName } from "@/lib/reviews";

export type ReviewState = { status: "idle" | "success" | "error"; message?: string };

const rating = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
};

// One review per customer: posting again replaces their earlier one.
export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const customer = await getCustomer();
  if (customer.status === "signed-out") return { status: "error", message: "Please sign in to leave a review." };
  const p = customer.profile;

  const values = Object.fromEntries(CRITERIA.map((c) => [c.key, rating(formData.get(c.key))]));
  const missing = CRITERIA.find((c) => values[c.key] == null);
  if (missing) return { status: "error", message: `Choose a star rating for ${missing.label.toLowerCase()}.` };
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 2000);

  const supabase = await createClient();
  const { data: existing } = await supabase.from("reviews").select("id").eq("userId", p.userId).maybeSingle();
  const row = { userId: p.userId, displayName: publicName(p.name, p.email), ...values, comment };
  const { error } = existing
    ? await supabase.from("reviews").update(row).eq("userId", p.userId)
    : await supabase.from("reviews").insert(row);
  if (error) return { status: "error", message: "Couldn’t save your review — please try again." };

  revalidatePath("/reviews");
  revalidatePath("/");
  await sendReviewNotification({
    name: p.name || p.email,
    email: p.email,
    ratings: CRITERIA.map((c) => ({ label: c.label, value: values[c.key] as number })),
    comment,
    edited: Boolean(existing),
  });
  return { status: "success" };
}
