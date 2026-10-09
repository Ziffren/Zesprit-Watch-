"use client";

import { useState, type ReactNode } from "react";

// "Request to buy" | "Deposit & hold" switch above the purchase forms.
// The deposit tab only exists for pieces with a price.
export function PurchasePanel({ request, deposit }: { request: ReactNode; deposit: ReactNode | null }) {
  const [tab, setTab] = useState<"request" | "deposit">("request");
  if (!deposit) return <>{request}</>;
  return (
    <div className="purchase-panel">
      <div className="purchase-tabs" role="tablist" aria-label="How would you like to buy?">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "request"}
          className="purchase-tabs__tab"
          onClick={() => setTab("request")}
        >
          Request to buy
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "deposit"}
          className="purchase-tabs__tab"
          onClick={() => setTab("deposit")}
        >
          Deposit &amp; hold
        </button>
      </div>
      <div role="tabpanel" hidden={tab !== "request"}>
        {request}
      </div>
      <div role="tabpanel" hidden={tab !== "deposit"}>
        {deposit}
      </div>
    </div>
  );
}
