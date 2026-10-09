"use client";

import { useState } from "react";

// Native share sheet where available (phones), otherwise copy the link.
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // cancelled — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }
  return (
    <button type="button" className="share-btn" onClick={share}>
      <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M8 10.5V2M5 4.75 8 1.75l3 3M3.25 8.5v5h9.5v-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
