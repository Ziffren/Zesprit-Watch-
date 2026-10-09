// Shared vocabulary for Watch Sourcing — values match the CHECK constraints
// in Watch Report rls/0027_sourcing_requests.sql.

export const CONDITIONS = [
  { value: "ANY", label: "Any condition" },
  { value: "GOOD", label: "Good — visible wear, fully working" },
  { value: "EXCELLENT", label: "Excellent — light signs of use" },
  { value: "LIKE_NEW", label: "Like new — barely worn" },
  { value: "NOS", label: "New old stock (unworn)" },
] as const;

export const BOX_PAPERS = [
  { value: "ANY", label: "No preference" },
  { value: "FULL_SET", label: "Full set — box, booklets & warranty card" },
  { value: "BOX_ONLY", label: "Box only" },
  { value: "PAPERS_ONLY", label: "Papers / warranty card only" },
  { value: "WATCH_ONLY", label: "Watch only is fine" },
] as const;

export const CONTACT_METHODS = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone call" },
  { value: "LINE", label: "LINE" },
  { value: "WHATSAPP", label: "WhatsApp" },
] as const;

export const SOURCING_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "SEARCHING", label: "Searching" },
  { value: "FOUND", label: "Found" },
  { value: "CLOSED", label: "Closed" },
] as const;

export type SourcingStatus = (typeof SOURCING_STATUSES)[number]["value"];

export const MAX_REFERENCE_LINKS = 5;

export const labelOf = <T extends readonly { value: string; label: string }[]>(list: T, value: string) =>
  list.find((x) => x.value === value)?.label ?? value;

export function formatBudget(min: number | null, max: number | null): string {
  const f = (c: number) => `$${Math.round(c / 100).toLocaleString("en-US")}`;
  if (min != null && max != null) return `${f(min)} – ${f(max)}`;
  if (min != null) return `From ${f(min)}`;
  if (max != null) return `Up to ${f(max)}`;
  return "Open budget";
}

export type SourcingRequest = {
  id: string;
  userId: string;
  brand: string;
  model: string | null;
  details: string | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  currency: string;
  condition: string;
  boxPapers: string;
  referenceLinks: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  contactMethod: string;
  status: SourcingStatus;
  createdAt: string;
  updatedAt: string;
};
