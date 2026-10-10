import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AccountGate } from "@/components/account-gate";
import { ReviewCard, ReviewScore } from "@/components/reviews";
import { getCustomer } from "@/lib/customer";
import { getReviews, publicName } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = {
  title: "Reviews — Z’esprit Watch",
  description: "What customers say about Z’esprit Watch — product quality, buying service and overall satisfaction.",
};

export const dynamic = "force-dynamic";

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const [{ summary, reviews, page: current, pageCount }, customer] = await Promise.all([
    getReviews(Number(page) || 1),
    getCustomer(),
  ]);

  let own = null;
  if (customer.status !== "signed-out") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("reviews")
      .select("productRating, serviceRating, satisfactionRating, comment")
      .eq("userId", customer.profile.userId)
      .maybeSingle();
    own = data;
  }

  return (
    <>
      <SiteHeader active="reviews" />
      <main className="reviews-page">
        <section className="reviews-intro">
          <p className="reviews-intro__kicker">Customer reviews</p>
          <h1 className="reviews-intro__title">Honest words from people who wear our watches.</h1>
          <ReviewScore summary={summary} />
        </section>

        <section className="reviews-form-wrap" aria-label="Write a review">
          <div className="sourcing-card">
            {customer.status === "signed-out" ? (
              <AccountGate customer={customer} next="/reviews" action="leave a review" />
            ) : (
              <ReviewForm initial={own} name={publicName(customer.profile.name, customer.profile.email)} />
            )}
          </div>
        </section>

        <section className="reviews-list" aria-labelledby="reviews-list-title">
          <h2 className="reviews-list__title" id="reviews-list-title">
            Latest reviews
          </h2>
          {reviews.length === 0 ? (
            <p className="reviews-list__empty">No reviews yet — be the first to share your experience.</p>
          ) : (
            <ul className="reviews-list__items">
              {reviews.map((r) => (
                <li key={r.id}>
                  <ReviewCard review={r} />
                </li>
              ))}
            </ul>
          )}
          {pageCount > 1 && (
            <nav className="collection-page__pager" aria-label="Pages">
              {current > 1 ? <Link href={current === 2 ? "/reviews" : `/reviews?page=${current - 1}`}>← Newer</Link> : <span />}
              <span>
                Page {current} of {pageCount}
              </span>
              {current < pageCount ? <Link href={`/reviews?page=${current + 1}`}>Older →</Link> : <span />}
            </nav>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
