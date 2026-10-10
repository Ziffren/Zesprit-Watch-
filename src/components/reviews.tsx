import { CRITERIA, formatRating, formatReviewDate, reviewOverall, type Review, type ReviewSummary } from "@/lib/reviews";

const STAR_PATH = "m12 3.2 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7Z";

// Read-only stars; fractional values fill partially (4.3 → 4 and a third).
export function Stars({ value, size = 16, label }: { value: number; size?: number; label?: string }) {
  return (
    <span className="stars" role="img" aria-label={label ?? `${formatRating(value)} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="stars__star" style={{ width: size, height: size }}>
            <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
              <path d={STAR_PATH} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            {fill > 0 && (
              <span className="stars__fill" style={{ width: `${fill * 100}%` }}>
                <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
                  <path d={STAR_PATH} fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

// Overall score + one bar per criterion.
export function ReviewScore({ summary, compact = false }: { summary: ReviewSummary; compact?: boolean }) {
  return (
    <div className={compact ? "review-score review-score--compact" : "review-score"}>
      <div className="review-score__overall">
        <p className="review-score__number">{summary.count ? formatRating(summary.overall) : "—"}</p>
        <div>
          <Stars value={summary.overall} size={compact ? 18 : 22} />
          <p className="review-score__count">
            {summary.count === 0 ? "No reviews yet" : `${summary.count} ${summary.count === 1 ? "review" : "reviews"}`}
          </p>
        </div>
      </div>
      <dl className="review-score__criteria">
        {CRITERIA.map((c) => (
          <div key={c.key} className="review-score__row">
            <dt>{c.label}</dt>
            <dd>
              <span className="review-score__bar" aria-hidden="true">
                <span style={{ width: `${(summary.averages[c.key] / 5) * 100}%` }} />
              </span>
              <span className="review-score__value">{summary.count ? formatRating(summary.averages[c.key]) : "—"}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  const edited = new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 60_000;
  return (
    <article className="review-card">
      <header className="review-card__head">
        <span className="review-card__avatar" aria-hidden="true">
          {review.displayName.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="review-card__name">{review.displayName}</p>
          <p className="review-card__date">
            {formatReviewDate(review.createdAt)}
            {edited ? " · edited" : ""}
          </p>
        </div>
        <Stars value={reviewOverall(review)} size={16} />
      </header>
      <ul className="review-card__criteria">
        {CRITERIA.map((c) => (
          <li key={c.key}>
            {c.label} <strong>{review[c.key]}/5</strong>
          </li>
        ))}
      </ul>
      {review.comment && <p className="review-card__comment">{review.comment}</p>}
    </article>
  );
}
