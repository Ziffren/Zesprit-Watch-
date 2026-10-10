"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notifyCounts } from "@/lib/store-events";

// Removes a watch from the cart or the wishlist, then refreshes the list.
export function RemoveButton({ table, watchId, label }: { table: "cart_items" | "saved_watches"; watchId: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="line-remove"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) await supabase.from(table).delete().eq("userId", user.id).eq("watchId", watchId);
        notifyCounts();
        router.refresh();
      }}
    >
      {busy ? "Removing…" : label}
    </button>
  );
}
