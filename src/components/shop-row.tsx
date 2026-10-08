"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

// Horizontal product row: native scroll-snap (swipe/trackpad/keyboard all
// work), with a centred "‹ 2/21 ›" pager that pages by one visible width
// and a "View all" button underneath.
export function ShopRow({
  label,
  viewAllHref,
  children,
}: {
  label: string;
  viewAllHref: string;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ page: 1, pages: 1 });

  const measure = useCallback(() => {
    const t = trackRef.current;
    if (!t || t.clientWidth === 0) return;
    const step = t.clientWidth * 0.9;
    const maxScroll = Math.max(0, t.scrollWidth - t.clientWidth);
    const pages = maxScroll === 0 ? 1 : Math.ceil(maxScroll / step) + 1;
    const page = t.scrollLeft >= maxScroll - 4 ? pages : Math.min(pages, Math.round(t.scrollLeft / step) + 1);
    setPos((prev) => (prev.page === page && prev.pages === pages ? prev : { page, pages }));
  }, []);

  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    const ro = new ResizeObserver(measure);
    ro.observe(t);
    return () => ro.disconnect();
  }, [measure]);

  const go = (dir: 1 | -1) => {
    const t = trackRef.current;
    if (!t) return;
    t.scrollBy({ left: dir * t.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <div className="shop-row">
      <ul className="shop-row__track" ref={trackRef} onScroll={measure} aria-label={label}>
        {children}
      </ul>

      <div className="shop-row__pager">
        <button type="button" className="shop-row__arrow" onClick={() => go(-1)} disabled={pos.page <= 1} aria-label="Previous pieces">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="shop-row__count" aria-live="polite">
          {pos.page}/{pos.pages}
        </span>
        <button type="button" className="shop-row__arrow" onClick={() => go(1)} disabled={pos.page >= pos.pages} aria-label="Next pieces">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="m6 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="shop-row__more">
        <Link className="shop-row__all" href={viewAllHref}>
          View all
        </Link>
      </div>
    </div>
  );
}
