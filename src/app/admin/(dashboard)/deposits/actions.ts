"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DepositActionState = { error: string | null; done: string | null };

function refresh(id: string, watchId?: string) {
  revalidatePath("/admin/deposits");
  revalidatePath(`/admin/deposits/${id}`);
  revalidatePath("/admin/products");
  if (watchId) revalidatePath(`/watches/${watchId}`);
  revalidatePath("/");
  revalidatePath("/collections/[slug]", "page");
}

// Confirm received → deposit CONFIRMED + product ON HOLD until now + holdDays.
// Mark sold        → deposit COMPLETED + product SOLD (sold date today).
// Cancel           → deposit CANCELLED; a held product goes back to AVAILABLE.
export async function depositAction(_prev: DepositActionState, formData: FormData): Promise<DepositActionState> {
  const id = String(formData.get("id") ?? "");
  const op = String(formData.get("op") ?? "");
  const supabase = await createClient();

  const { data: d } = await supabase.from("deposit_requests").select("id, watchId, status").eq("id", id).maybeSingle();
  if (!d) return { error: "Deposit not found.", done: null };
  const { data: product } = await supabase.from("products").select("status").eq("id", d.watchId).maybeSingle();

  if (op === "confirm") {
    if (d.status !== "PENDING") return { error: "Only a deposit awaiting payment can be confirmed.", done: null };
    if (product?.status !== "AVAILABLE") {
      return { error: `The watch is ${product?.status?.toLowerCase() ?? "missing"} — it can't be put on hold.`, done: null };
    }
    const { data: settings } = await supabase.from("shop_settings").select("holdDays").eq("id", 1).maybeSingle();
    const holdUntil = new Date(Date.now() + (settings?.holdDays ?? 14) * 86_400_000).toISOString();
    const { error } = await supabase
      .from("deposit_requests")
      .update({ status: "CONFIRMED", confirmedAt: new Date().toISOString(), holdUntil })
      .eq("id", id);
    if (error) {
      return { error: error.code === "23505" ? "Another deposit is already holding this watch." : error.message, done: null };
    }
    const { error: pErr } = await supabase.from("products").update({ status: "HOLD" }).eq("id", d.watchId);
    if (pErr) return { error: `Deposit confirmed, but the watch status didn't change: ${pErr.message}`, done: null };
    refresh(id, d.watchId);
    return { error: null, done: "Deposit confirmed — the watch is on hold." };
  }

  if (op === "complete") {
    if (d.status !== "CONFIRMED") return { error: "Confirm the deposit before marking the sale.", done: null };
    const { error } = await supabase.from("deposit_requests").update({ status: "COMPLETED" }).eq("id", id);
    if (error) return { error: error.message, done: null };
    // Sold date in the shop's own time zone (Japan), not the server's UTC.
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
    const { error: pErr } = await supabase.from("products").update({ status: "SOLD", soldAt: today }).eq("id", d.watchId);
    if (pErr) return { error: `Marked complete, but the watch status didn't change: ${pErr.message}`, done: null };
    refresh(id, d.watchId);
    return { error: null, done: "Sale completed — the watch is marked sold." };
  }

  if (op === "cancel") {
    if (d.status !== "PENDING" && d.status !== "CONFIRMED") return { error: "This deposit is already closed.", done: null };
    const { error } = await supabase.from("deposit_requests").update({ status: "CANCELLED" }).eq("id", id);
    if (error) return { error: error.message, done: null };
    if (d.status === "CONFIRMED" && product?.status === "HOLD") {
      const { error: pErr } = await supabase.from("products").update({ status: "AVAILABLE" }).eq("id", d.watchId);
      if (pErr) return { error: `Cancelled, but the watch is still on hold: ${pErr.message}`, done: null };
    }
    refresh(id, d.watchId);
    return { error: null, done: d.status === "CONFIRMED" ? "Cancelled — the watch is available again." : "Request cancelled." };
  }

  return { error: "Unknown action.", done: null };
}

export type SettingsState = { error: string | null; savedAt: number | null };

export async function saveShopSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const depositPercent = Number(formData.get("depositPercent"));
  const holdDays = Number(formData.get("holdDays"));
  const paymentInstructions = String(formData.get("paymentInstructions") ?? "").trim();
  if (!Number.isInteger(depositPercent) || depositPercent < 1 || depositPercent > 100) {
    return { error: "Deposit must be a whole percentage between 1 and 100.", savedAt: null };
  }
  if (!Number.isInteger(holdDays) || holdDays < 1 || holdDays > 90) {
    return { error: "Hold period must be between 1 and 90 days.", savedAt: null };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("shop_settings")
    .update({ depositPercent, holdDays, paymentInstructions: paymentInstructions || null })
    .eq("id", 1);
  if (error) return { error: error.message, savedAt: null };
  revalidatePath("/admin/deposits/settings");
  revalidatePath("/watches/[id]", "page");
  return { error: null, savedAt: Date.now() };
}
