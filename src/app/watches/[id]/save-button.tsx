"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { notifyCounts } from "@/lib/store-events";

type Status = "loading" | "signed-out" | "saved" | "not-saved";

const Heart = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill={filled ? "currentColor" : "none"} aria-hidden="true">
    <path
      d="M12 20.2s-7.6-4.6-7.6-10.1A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.6 2.7c0 5.5-7.6 10.1-7.6 10.1Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

// Wishlist toggle (heart). Signed-in only — saves to saved_watches and
// updates the header heart count.
export function SaveButton({ watchId }: { watchId: string }) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return !cancelled && setStatus("signed-out");
      const { data } = await supabase
        .from("saved_watches")
        .select("watchId")
        .eq("userId", user.id)
        .eq("watchId", watchId)
        .maybeSingle();
      if (!cancelled) setStatus(data ? "saved" : "not-saved");
    })();
    return () => {
      cancelled = true;
    };
  }, [watchId]);

  async function toggle() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setStatus("signed-out");
    const wasSaved = status === "saved";
    setStatus(wasSaved ? "not-saved" : "saved");
    const { error } = wasSaved
      ? await supabase.from("saved_watches").delete().eq("userId", user.id).eq("watchId", watchId)
      : await supabase.from("saved_watches").insert({ userId: user.id, watchId });
    if (error) setStatus(wasSaved ? "saved" : "not-saved");
    else notifyCounts();
  }

  if (status === "signed-out") {
    return (
      <Link className="wish-btn" href={`/account/login?next=${encodeURIComponent(`/watches/${watchId}`)}`}>
        <Heart filled={false} />
        Save to wishlist
      </Link>
    );
  }

  const saved = status === "saved";
  return (
    <button
      className="wish-btn"
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      data-saved={saved || undefined}
      disabled={status === "loading"}
    >
      <Heart filled={saved} />
      {saved ? "Saved to wishlist" : "Save to wishlist"}
    </button>
  );
}
