"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Status = "loading" | "signed-out" | "saved" | "not-saved";

export function SaveButton({ watchId }: { watchId: string }) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setStatus("signed-out");
        return;
      }
      const { data } = await supabase
        .from("saved_watches")
        .select("watchId")
        .eq("userId", user.id)
        .eq("watchId", watchId)
        .maybeSingle();
      if (!cancelled) setStatus(data ? "saved" : "not-saved");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [watchId]);

  async function toggle() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (status === "saved") {
      setStatus("not-saved");
      const { error } = await supabase
        .from("saved_watches")
        .delete()
        .eq("userId", user.id)
        .eq("watchId", watchId);
      if (error) setStatus("saved");
    } else {
      setStatus("saved");
      const { error } = await supabase
        .from("saved_watches")
        .insert({ userId: user.id, watchId });
      if (error) setStatus("not-saved");
    }
  }

  if (status === "loading") return null;

  if (status === "signed-out") {
    return (
      <Link
        className="save-button save-button--link"
        href={`/account/login?next=${encodeURIComponent(`/watches/${watchId}`)}`}
      >
        ♡ Save to wishlist
      </Link>
    );
  }

  return (
    <button className="save-button" type="button" onClick={toggle} aria-pressed={status === "saved"}>
      {status === "saved" ? "♥ Saved" : "♡ Save to wishlist"}
    </button>
  );
}
