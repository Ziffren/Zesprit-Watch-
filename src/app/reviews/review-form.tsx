"use client";

import { useActionState, useState } from "react";
import { useKeepForm } from "@/lib/use-keep-form";
import { CRITERIA, RATING_WORDS, type CriterionKey } from "@/lib/reviews";
import { submitReview, type ReviewState } from "./actions";

type Initial = Partial<Record<CriterionKey, number>> & { comment?: string };

const Star = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
    <path
      d="m12 3.2 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7Z"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

// Five radio stars for one criterion — keyboard: arrow keys move, like any
// radio group. Hover previews the rating.
function StarInput({ name, label, value, onChange }: { name: string; label: string; value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset className="star-input">
      <legend className="star-input__label">{label}</legend>
      <div className="star-input__stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="star-input__star" data-on={n <= shown || undefined} onMouseEnter={() => setHover(n)}>
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              required
              aria-label={`${n} ${n === 1 ? "star" : "stars"} — ${RATING_WORDS[n]}`}
            />
            <Star filled={n <= shown} />
          </label>
        ))}
      </div>
      <span className="star-input__word" aria-hidden="true">
        {shown ? RATING_WORDS[shown] : "Tap to rate"}
      </span>
    </fieldset>
  );
}

export function ReviewForm({ initial, name }: { initial: Initial | null; name: string }) {
  const [state, action, pending] = useActionState(submitReview, { status: "idle" } as ReviewState);
  const keep = useKeepForm(action);
  const [ratings, setRatings] = useState<Record<CriterionKey, number>>({
    productRating: initial?.productRating ?? 0,
    serviceRating: initial?.serviceRating ?? 0,
    satisfactionRating: initial?.satisfactionRating ?? 0,
  });
  const editing = Boolean(initial);

  if (state.status === "success") {
    return (
      <div className="order-form__success review-sent" role="status">
        <p className="order-form__success-title">Thank you{name ? `, ${name.split(" ")[0]}` : ""}!</p>
        <p>Your review is live on the page. You can come back and change it any time.</p>
      </div>
    );
  }

  return (
    <form className="review-form" action={action} onSubmit={keep}>
      <h2 className="review-form__title">{editing ? "Update your review" : "Rate your experience"}</h2>
      <p className="review-form__lede">
        Posting as <strong>{name}</strong>
        {editing ? " — this replaces your earlier review." : "."}
      </p>

      {CRITERIA.map((c) => (
        <StarInput
          key={c.key}
          name={c.key}
          label={c.label}
          value={ratings[c.key]}
          onChange={(n) => setRatings((r) => ({ ...r, [c.key]: n }))}
        />
      ))}

      <label className="order-form__field">
        <span>Your experience (optional)</span>
        <textarea
          name="comment"
          rows={5}
          maxLength={2000}
          defaultValue={initial?.comment ?? ""}
          placeholder="How was the watch, the packaging, the communication?"
        />
      </label>

      {state.status === "error" && (
        <p className="order-form__error" role="alert">
          {state.message}
        </p>
      )}
      <button className="cta-solid" type="submit" disabled={pending}>
        {pending ? "Posting…" : editing ? "Update review" : "Post review"}
      </button>
    </form>
  );
}
