"use client";

import { HeartIcon, useWish } from "@/components/card-heart";

// Wishlist toggle (big heart) on the product page. Signed-in only — guests
// are sent to sign in. Shares state with every other heart for this piece.
export function SaveButton({ watchId, count: initialCount }: { watchId: string; count: number }) {
  const { saved, count, busy, toggle } = useWish(watchId, initialCount);
  return (
    <button
      className="wish-btn"
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      data-saved={saved || undefined}
      disabled={busy}
    >
      <HeartIcon filled={saved} size={20} />
      {saved ? "Saved to wishlist" : "Save to wishlist"}
      {count > 0 && <span className="wish-btn__count">· {count} {count === 1 ? "save" : "saves"}</span>}
    </button>
  );
}
