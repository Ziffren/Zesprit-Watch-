"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { notifyCounts } from "@/lib/store-events";

type Status = "loading" | "in" | "out" | "busy";

// "Add to cart" for signed-in customers (the parent decides who sees it).
export function CartButton({ watchId }: { watchId: string }) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("cart_items")
        .select("watchId")
        .eq("userId", user.id)
        .eq("watchId", watchId)
        .maybeSingle();
      if (!cancelled) setStatus(data ? "in" : "out");
    })();
    return () => {
      cancelled = true;
    };
  }, [watchId]);

  async function add() {
    setStatus("busy");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setStatus("out");
    const { error } = await supabase.from("cart_items").insert({ userId: user.id, watchId });
    setStatus(error && error.code !== "23505" ? "out" : "in");
    notifyCounts();
  }

  if (status === "in") {
    return (
      <Link className="buy-btn buy-btn--primary" href="/cart">
        In your cart — view cart
      </Link>
    );
  }
  return (
    <button type="button" className="buy-btn buy-btn--primary" onClick={add} disabled={status !== "out"}>
      {status === "busy" ? "Adding…" : "Add to cart"}
    </button>
  );
}
