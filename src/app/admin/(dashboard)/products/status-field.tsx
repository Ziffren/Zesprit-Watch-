"use client";

import { useState } from "react";
import type { WatchStatus } from "@/lib/admin/types";

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Availability + the date it sold. Switching to Sold pre-fills today (the
// owner can change it); switching back to Available clears it on save.
export function StatusField({
  initialStatus,
  initialSoldAt,
}: {
  initialStatus: WatchStatus;
  initialSoldAt: string | null;
}) {
  const [status, setStatus] = useState<WatchStatus>(initialStatus);
  const [soldAt, setSoldAt] = useState(initialSoldAt ?? "");

  return (
    <>
      <label className="admin-field">
        <span>Availability</span>
        <select
          name="status"
          value={status}
          onChange={(e) => {
            const next = e.target.value as WatchStatus;
            setStatus(next);
            if (next === "SOLD" && !soldAt) setSoldAt(todayLocal());
          }}
        >
          <option value="AVAILABLE">Available</option>
          <option value="HOLD">On hold (deposit received)</option>
          <option value="SOLD">Sold</option>
        </select>
      </label>

      {status === "SOLD" && (
        <label className="admin-field">
          <span>Sold date</span>
          <input
            type="date"
            name="sold_at"
            value={soldAt}
            onChange={(e) => setSoldAt(e.target.value)}
          />
          {!soldAt && <span className="admin-hint">Not set — add the date it sold.</span>}
        </label>
      )}
    </>
  );
}
