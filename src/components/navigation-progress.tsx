"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { navProgress } from "@/lib/nav-progress";

function isInternalNavigation(e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const anchor = (e.target as Element | null)?.closest?.("a");
  if (!anchor || !anchor.href || anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin) return false;
  // Same page (or just a #hash jump) — nothing will load.
  return url.pathname !== location.pathname || url.search !== location.search;
}

// Thin brass bar across the top + a small % readout, on every in-app
// navigation (storefront and admin alike).
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { active, visible, percent } = useSyncExternalStore(
    navProgress.subscribe,
    navProgress.get,
    navProgress.get,
  );

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (isInternalNavigation(e)) navProgress.start();
    };
    const onPop = () => navProgress.start();
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // The URL changed → the new route has committed (or is showing its
  // skeleton, which holds the bar until the data lands).
  useEffect(() => {
    navProgress.settle();
  }, [pathname, searchParams]);

  const shown = active && visible;

  return (
    <div className="nav-progress" data-visible={shown} data-done={percent >= 100} aria-hidden={!shown}>
      <div className="nav-progress__bar" style={{ transform: `scaleX(${percent / 100})` }} />
      <span className="nav-progress__pct" role="status" aria-live="off">
        {Math.round(percent)}%
      </span>
    </div>
  );
}
