"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BrandLink } from "@/lib/storefront";

// Desktop "Watches" item: opens on hover (with a short grace period so the
// pointer can travel into the panel) and on click/Enter for keyboard and
// touch. Lists every brand in stock; each goes to its collection page.
export function WatchesMenu({ brands, active }: { brands: BrandLink[]; active: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      className="watches-menu"
      ref={rootRef}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        cancelClose();
        setOpen(true);
      }}
      onPointerLeave={(e) => e.pointerType === "mouse" && scheduleClose()}
    >
      <button
        type="button"
        className={active ? "watches-menu__trigger is-active" : "watches-menu__trigger"}
        aria-expanded={open}
        aria-controls="watches-menu-panel"
        onClick={() => setOpen((v) => !v)}
      >
        Watches
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="watches-menu__panel" id="watches-menu-panel" hidden={!open}>
        <p className="watches-menu__heading">Shop by brand</p>
        {brands.length === 0 ? (
          <p className="watches-menu__empty">New pieces are being prepared.</p>
        ) : (
          <ul className="watches-menu__list">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link href={`/collections/${b.slug}`} onClick={() => setOpen(false)}>
                  <span>{b.name}</span>
                  <span className="watches-menu__count">{b.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link className="watches-menu__all" href="/collections/all" onClick={() => setOpen(false)}>
          View all watches →
        </Link>
      </div>
    </div>
  );
}
