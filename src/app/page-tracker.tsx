"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "zw_session_id";

function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Private browsing / blocked storage — fall back to a per-load id rather
    // than skip tracking entirely; it just won't count as a returning visit.
    return crypto.randomUUID();
  }
}

// Never tracks /admin/* — that's the owner's own usage, not a visitor.
export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          sessionId: getSessionId(),
          referrer: document.referrer || null,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Best-effort only.
    }
  }, [pathname]);

  return null;
}
