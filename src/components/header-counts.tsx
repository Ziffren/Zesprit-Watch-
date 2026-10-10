"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COUNTS_EVENT } from "@/lib/store-events";

// Wishlist (heart) and cart icons for the header. Counts — and the lists
// behind them — only exist for signed-in customers; signed-out visitors are
// sent to sign in first. Read in the browser so pages stay cached.
export function HeaderCounts() {
  const [counts, setCounts] = useState<{ wish: number; cart: number } | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    if (!uid) return setCounts(null);
    const [w, c] = await Promise.all([
      supabase.from("saved_watches").select("watchId", { count: "exact", head: true }).eq("userId", uid),
      supabase.from("cart_items").select("watchId", { count: "exact", head: true }).eq("userId", uid),
    ]);
    setCounts({ wish: w.count ?? 0, cart: c.count ?? 0 });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from an external store (Supabase)
    load();
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    window.addEventListener(COUNTS_EVENT, load);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener(COUNTS_EVENT, load);
    };
  }, [load]);

  const signedIn = counts !== null;
  const wishHref = signedIn ? "/wishlist" : "/account/login?next=%2Fwishlist";
  const cartHref = signedIn ? "/cart" : "/account/login?next=%2Fcart";

  return (
    <>
      <Link className="icon-link count-link" href={wishHref} aria-label={signedIn ? `Wishlist, ${counts.wish} saved` : "Wishlist (sign in)"}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 20.2s-7.6-4.6-7.6-10.1A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.6 2.7c0 5.5-7.6 10.1-7.6 10.1Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        {signedIn && counts.wish > 0 && <span className="cart-count">{counts.wish}</span>}
      </Link>
      <Link className="icon-link count-link" href={cartHref} aria-label={signedIn ? `Cart, ${counts.cart} item${counts.cart === 1 ? "" : "s"}` : "Cart (sign in)"}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 8h16l-1.4 9.5a2 2 0 0 1-2 1.7H7.4a2 2 0 0 1-2-1.7L4 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 8V6a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        {signedIn && counts.cart > 0 && <span className="cart-count">{counts.cart}</span>}
      </Link>
    </>
  );
}
