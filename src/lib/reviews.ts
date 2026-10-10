import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const CRITERIA = [
  { key: "productRating", label: "Product quality" },
  { key: "serviceRating", label: "Buying service" },
  { key: "satisfactionRating", label: "Overall satisfaction" },
] as const;
export type CriterionKey = (typeof CRITERIA)[number]["key"];

export const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"] as const;

export type Review = {
  id: string;
  displayName: string;
  productRating: number;
  serviceRating: number;
  satisfactionRating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewSummary = {
  count: number;
  /** Mean of the three criteria, 0 when there are no reviews. */
  overall: number;
  averages: Record<CriterionKey, number>;
  /** How many reviews round to 5★, 4★ … 1★ overall (index 0 = 5★). */
  distribution: number[];
};

const REVIEW_COLUMNS = "id, displayName, productRating, serviceRating, satisfactionRating, comment, createdAt, updatedAt";

export const reviewOverall = (r: Pick<Review, CriterionKey>) =>
  (r.productRating + r.serviceRating + r.satisfactionRating) / 3;

// Public name on a review: first name + last initial ("Minh H.").
export function publicName(name: string | null, email: string): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return email.split("@")[0].slice(0, 40) || "Customer";
  if (parts.length === 1) return parts[0].slice(0, 40);
  return `${parts[0].slice(0, 40)} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function summarize(reviews: Pick<Review, CriterionKey>[]): ReviewSummary {
  const count = reviews.length;
  const avg = (k: CriterionKey) => (count ? reviews.reduce((s, r) => s + r[k], 0) / count : 0);
  const averages = {
    productRating: avg("productRating"),
    serviceRating: avg("serviceRating"),
    satisfactionRating: avg("satisfactionRating"),
  };
  const distribution = [0, 0, 0, 0, 0];
  for (const r of reviews) distribution[5 - Math.min(5, Math.max(1, Math.round(reviewOverall(r))))]++;
  const overall = count ? (averages.productRating + averages.serviceRating + averages.satisfactionRating) / 3 : 0;
  return { count, overall, averages, distribution };
}

export const REVIEWS_PAGE_SIZE = 12;

// Visible reviews, newest first, plus the summary over all of them.
export async function getReviews(page = 1): Promise<{ summary: ReviewSummary; reviews: Review[]; pageCount: number; page: number }> {
  const empty = { summary: summarize([]), reviews: [], pageCount: 1, page: 1 };
  if (!isSupabaseConfigured) return empty;
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("reviews")
      .select(REVIEW_COLUMNS)
      .eq("hidden", false)
      .order("createdAt", { ascending: false })
      .limit(2000);
    const all = (data ?? []) as Review[];
    const pageCount = Math.max(1, Math.ceil(all.length / REVIEWS_PAGE_SIZE));
    const current = Math.min(Math.max(1, page), pageCount);
    return {
      summary: summarize(all),
      reviews: all.slice((current - 1) * REVIEWS_PAGE_SIZE, current * REVIEWS_PAGE_SIZE),
      pageCount,
      page: current,
    };
  } catch {
    return empty;
  }
}

export const formatRating = (n: number) => n.toFixed(1);

export const formatReviewDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Tokyo" }).format(
    new Date(iso),
  );
