import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CRITERIA, formatRating, formatReviewDate, reviewOverall, summarize, type Review } from "@/lib/reviews";
import { deleteReview, setReviewHidden } from "./actions";

export const dynamic = "force-dynamic";

type AdminReview = Review & { hidden: boolean; customer: { email: string; name: string | null } | null };

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      "id, displayName, productRating, serviceRating, satisfactionRating, comment, hidden, createdAt, updatedAt, customer:customer_profiles(email, name)",
    )
    .order("createdAt", { ascending: false })
    .limit(1000);
  const reviews = (data ?? []) as unknown as AdminReview[];
  const visible = reviews.filter((r) => !r.hidden);
  const summary = summarize(visible);

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Reviews</p>
      </header>

      <div className="admin-content">
        <div className="admin-stats-row">
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">Average (shown)</span>
            <span className="admin-stat-tile__value">{summary.count ? `${formatRating(summary.overall)} ★` : "—"}</span>
          </div>
          {CRITERIA.map((c) => (
            <div key={c.key} className="admin-stat-tile">
              <span className="admin-stat-tile__label">{c.label}</span>
              <span className="admin-stat-tile__value">{summary.count ? formatRating(summary.averages[c.key]) : "—"}</span>
            </div>
          ))}
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">Shown / hidden</span>
            <span className="admin-stat-tile__value">
              {visible.length} / {reviews.length - visible.length}
            </span>
          </div>
        </div>
        <p className="admin-hint" style={{ marginBottom: "var(--space-md)" }}>
          From the <Link href="/reviews">Reviews</Link> page — one per signed-in customer, live as soon as it&rsquo;s
          posted. Hide a review to take it off the site without deleting it.
        </p>

        {reviews.length === 0 ? (
          <p className="admin-empty">No reviews yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table review-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Ratings</th>
                  <th>Comment</th>
                  <th>Posted</th>
                  <th>Status</th>
                  <th>
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} data-hidden={r.hidden || undefined}>
                    <td>
                      <span className="review-table__name">{r.customer?.name || r.displayName}</span>
                      <span className="admin-hint">{r.customer?.email}</span>
                    </td>
                    <td className="review-table__ratings">
                      <strong>{formatRating(reviewOverall(r))} ★</strong>
                      <span className="admin-hint">
                        {r.productRating} · {r.serviceRating} · {r.satisfactionRating}
                      </span>
                    </td>
                    <td className="review-table__comment">{r.comment || <span className="admin-hint">—</span>}</td>
                    <td className="admin-hint">{formatReviewDate(r.createdAt)}</td>
                    <td>
                      <span className="admin-badge" data-tone={r.hidden ? "draft" : "active"}>
                        {r.hidden ? "Hidden" : "Shown"}
                      </span>
                    </td>
                    <td>
                      <div className="review-table__actions">
                        <form action={setReviewHidden}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="hidden" value={r.hidden ? "0" : "1"} />
                          <button className="admin-btn admin-btn--ghost" type="submit">
                            {r.hidden ? "Show" : "Hide"}
                          </button>
                        </form>
                        <form action={deleteReview}>
                          <input type="hidden" name="id" value={r.id} />
                          <button className="admin-btn admin-btn--danger" type="submit">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="admin-hint" style={{ marginTop: "var(--space-sm)" }}>
          Ratings column: overall, then product quality · buying service · satisfaction.
        </p>
      </div>
    </>
  );
}
