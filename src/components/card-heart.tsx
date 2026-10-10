"use client";

import { useEffect, useRef, useState } from "react";
import { loadWishlist, loginHref, toggleWish, WISH_EVENT, type WishChange } from "@/lib/wishlist-client";

export function HeartIcon({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="M12 20.2s-7.6-4.6-7.6-10.1A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.6 2.7c0 5.5-7.6 10.1-7.6 10.1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Saved state + live count for one piece, kept in sync across every heart
// showing the same piece (card, product page, related row).
export function useWish(watchId: string, initialCount: number) {
  const [saved, setSaved] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const savedRef = useRef(false);

  useEffect(() => {
    let live = true;
    loadWishlist().then((w) => {
      if (!live) return;
      savedRef.current = w.saved.has(watchId);
      setSaved(savedRef.current);
    });
    const onChange = (e: Event) => {
      const d = (e as CustomEvent<WishChange>).detail;
      if (d.watchId !== watchId) return;
      if (savedRef.current === d.saved) return;
      savedRef.current = d.saved;
      setSaved(d.saved);
      setCount((c) => Math.max(0, c + (d.saved ? 1 : -1)));
    };
    window.addEventListener(WISH_EVENT, onChange);
    return () => {
      live = false;
      window.removeEventListener(WISH_EVENT, onChange);
    };
  }, [watchId]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const result = await toggleWish(watchId);
    setBusy(false);
    if (result === null) window.location.href = loginHref();
  }

  return { saved, count, busy, toggle };
}

// Small heart + count on product cards.
export function CardHeart({ watchId, count: initialCount, name }: { watchId: string; count: number; name: string }) {
  const { saved, count, busy, toggle } = useWish(watchId, initialCount);
  return (
    <button
      type="button"
      className="card-heart"
      onClick={toggle}
      aria-pressed={saved}
      aria-busy={busy || undefined}
      aria-label={`${saved ? "Remove" : "Save"} ${name} ${saved ? "from" : "to"} wishlist — ${count} ${count === 1 ? "save" : "saves"}`}
      data-saved={saved || undefined}
    >
      <HeartIcon filled={saved} />
      <span className="card-heart__count" aria-hidden="true">
        {count}
      </span>
    </button>
  );
}
