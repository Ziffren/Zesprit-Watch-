"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SORTS, type CollectionQuery, type StatusFilter } from "@/lib/collection-query";

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
  { value: "all", label: "All" },
];

// Shared filter + sort bar for every watch listing (/collections/all, brands,
// collections). State lives in the URL so results are linkable; any change
// returns to page 1.
export function FilterBar({ query, total }: { query: CollectionQuery; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function go(next: Partial<CollectionQuery>) {
    const q = { ...query, ...next };
    const sp = new URLSearchParams();
    if (q.sort !== "price-desc") sp.set("sort", q.sort);
    if (q.status !== "available") sp.set("status", q.status);
    if (q.sale) sp.set("sale", "1");
    const qs = sp.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  return (
    <div className="filter-bar" data-pending={pending || undefined}>
      <div className="filter-bar__group" role="group" aria-label="Availability">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            className="filter-seg"
            aria-pressed={query.status === s.value}
            onClick={() => go({ status: s.value })}
          >
            {s.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="filter-chip"
        aria-pressed={query.sale}
        onClick={() => go({ sale: !query.sale })}
      >
        <span className="filter-chip__box" aria-hidden="true" />
        On sale
      </button>

      <p className="filter-bar__count" aria-live="polite">
        {pending ? "Updating…" : `${total} ${total === 1 ? "piece" : "pieces"}`}
      </p>

      <label className="filter-sort">
        <span>Sort by</span>
        <select value={query.sort} onChange={(e) => go({ sort: e.target.value as CollectionQuery["sort"] })}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
