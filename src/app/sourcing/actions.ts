"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCustomer } from "@/lib/customer";
import { sendSourcingNotification } from "@/lib/email";
import {
  BOX_PAPERS,
  CONDITIONS,
  CONTACT_METHODS,
  MAX_REFERENCE_LINKS,
  formatBudget,
  labelOf,
} from "@/lib/sourcing";

export type SourcingState = { status: "idle" | "success" | "error"; message?: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const oneOf = (list: readonly { value: string }[], v: string, fallback: string) =>
  list.some((x) => x.value === v) ? v : fallback;

function dollarsToCents(v: string): number | null | "invalid" {
  if (!v) return null;
  const n = Number(v.replace(/[,\s$]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : "invalid";
}

// "Find me this watch." Signed-in customers with complete details only —
// same rule as requesting a listed piece.
export async function submitSourcing(_prev: SourcingState, formData: FormData): Promise<SourcingState> {
  const customer = await getCustomer();
  if (customer.status === "signed-out") return { status: "error", message: "Please sign in to send a sourcing request." };
  if (customer.status === "incomplete") return { status: "error", message: "Please add your phone and address first." };

  const brand = text(formData.get("brand"));
  const model = text(formData.get("model"));
  const details = text(formData.get("details"));
  const min = dollarsToCents(text(formData.get("minPrice")));
  const max = dollarsToCents(text(formData.get("maxPrice")));
  const condition = oneOf(CONDITIONS, text(formData.get("condition")), "ANY");
  const boxPapers = oneOf(BOX_PAPERS, text(formData.get("boxPapers")), "ANY");
  const contactName = text(formData.get("contactName"));
  const contactEmail = text(formData.get("contactEmail")).toLowerCase();
  const contactPhone = text(formData.get("contactPhone"));
  const contactMethod = oneOf(CONTACT_METHODS, text(formData.get("contactMethod")), "EMAIL");

  const links = formData
    .getAll("referenceLinks")
    .map((v) => String(v).trim())
    .filter(Boolean);

  if (!brand) return { status: "error", message: "Tell us the brand you're looking for." };
  if (min === "invalid" || max === "invalid") return { status: "error", message: "Enter prices as numbers, e.g. 3000." };
  if (min != null && max != null && min > max) return { status: "error", message: "The minimum price is higher than the maximum." };
  if (!contactName) return { status: "error", message: "Enter a contact name." };
  if (!emailPattern.test(contactEmail)) return { status: "error", message: "Enter a valid contact email." };
  if ((contactMethod === "PHONE" || contactMethod === "LINE" || contactMethod === "WHATSAPP") && !contactPhone) {
    return { status: "error", message: "Add a phone number (or LINE / WhatsApp ID) for your preferred contact method." };
  }
  if (links.length > MAX_REFERENCE_LINKS) return { status: "error", message: `Up to ${MAX_REFERENCE_LINKS} reference links.` };
  for (const l of links) {
    try {
      const u = new URL(l);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    } catch {
      return { status: "error", message: `"${l.slice(0, 60)}" isn't a valid link — it should start with https://` };
    }
  }

  const supabase = await createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase.from("sourcing_requests").insert({
    id,
    userId: customer.profile.userId,
    brand,
    model: model || null,
    details: details || null,
    minPriceCents: min,
    maxPriceCents: max,
    condition,
    boxPapers,
    referenceLinks: links,
    contactName,
    contactEmail,
    contactPhone: contactPhone || null,
    contactMethod,
  });

  if (error) return { status: "error", message: "Something went wrong — please try again." };

  await sendSourcingNotification({
    id,
    brand,
    model: model || null,
    budget: formatBudget(min, max),
    condition: labelOf(CONDITIONS, condition),
    boxPapers: labelOf(BOX_PAPERS, boxPapers),
    details: details || null,
    referenceLinks: links,
    contactName,
    contactEmail,
    contactPhone: contactPhone || null,
    contactMethod: labelOf(CONTACT_METHODS, contactMethod),
  });

  revalidatePath("/account");
  return { status: "success" };
}
