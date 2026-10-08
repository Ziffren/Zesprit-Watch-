"use client";

import { useRouter } from "next/navigation";
import { navProgress } from "@/lib/nav-progress";

type StatusFilter = {
  value: string;
  options: { value: string; label: string }[];
  ariaLabel: string;
};

// Shopify-style list search: one bar, no Search/Clear buttons. The query is
// applied when the field loses focus (or on Enter); an empty field drops the
// search condition. The optional status picker applies as soon as it changes.
export function AdminSearchBar({
  basePath,
  q,
  placeholder,
  ariaLabel,
  status,
}: {
  basePath: string;
  q: string;
  placeholder: string;
  ariaLabel: string;
  status?: StatusFilter;
}) {
  const router = useRouter();

  function go(nextQ: string, nextStatus: string | undefined) {
    const params = new URLSearchParams();
    if (nextQ) params.set("q", nextQ);
    if (nextStatus) params.set("status", nextStatus);
    // Page is dropped on purpose: a new filter starts from page 1.
    const qs = params.toString();
    navProgress.start();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function commit(input: HTMLInputElement) {
    const next = input.value.trim();
    if (next === q) return;
    go(next, status?.value || undefined);
  }

  return (
    <div className="admin-search" role="search">
      {status && (
        <select
          className="admin-search__status"
          aria-label={status.ariaLabel}
          defaultValue={status.value}
          onChange={(e) => go(q, e.target.value || undefined)}
        >
          {status.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      <label className="admin-search__field">
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="m10.5 10.5 3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          // Re-mount with the URL's query after each navigation (back/forward too).
          key={q}
          type="search"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoComplete="off"
          onBlur={(e) => commit(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(e.currentTarget);
            }
          }}
        />
      </label>
    </div>
  );
}
