import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Deposit-to-hold vocabulary — values match Watch Report rls/0030.

export const DEPOSIT_STATUSES = [
  { value: "PENDING", label: "Awaiting payment" },
  { value: "CONFIRMED", label: "Received · on hold" },
  { value: "COMPLETED", label: "Sold" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export type DepositStatus = (typeof DEPOSIT_STATUSES)[number]["value"];

export const depositStatusLabel = (v: string) => DEPOSIT_STATUSES.find((s) => s.value === v)?.label ?? v;

export type ShopSettings = { depositPercent: number; holdDays: number; paymentInstructions: string | null };

export const DEFAULT_SETTINGS: ShopSettings = { depositPercent: 20, holdDays: 14, paymentInstructions: null };

export async function getShopSettings(): Promise<ShopSettings> {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  try {
    const { data } = await createPublicClient()
      .from("shop_settings")
      .select("depositPercent, holdDays, paymentInstructions")
      .eq("id", 1)
      .maybeSingle();
    return data ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const depositAmount = (priceCents: number, percent: number) => Math.max(1, Math.round((priceCents * percent) / 100));

export type DepositRequest = {
  id: string;
  watchId: string;
  userId: string;
  amountCents: number;
  percent: number;
  currency: string;
  status: DepositStatus;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  message: string | null;
  confirmedAt: string | null;
  holdUntil: string | null;
  createdAt: string;
};

export const isOverdue = (d: Pick<DepositRequest, "status" | "holdUntil">, now = Date.now()) =>
  d.status === "CONFIRMED" && d.holdUntil != null && new Date(d.holdUntil).getTime() < now;
