"use client";

import { useActionState, useMemo, useState } from "react";
import { useKeepForm } from "@/lib/use-keep-form";
import { saveBulkPrices, type BulkPriceState } from "./actions";

export type PriceRow = { id: string; name: string; brand: string; status: string; priceCents: number | null; thumb: string | null };

const toDollars = (c: number | null) => (c == null ? "" : String(c / 100));

export function PriceTable({ rows }: { rows: PriceRow[] }) {
  const [state, action, pending] = useActionState(saveBulkPrices, { error: null, saved: null } as BulkPriceState);
  const keep = useKeepForm(action);
  const [filter, setFilter] = useState<"all" | "unpriced">("all");
  const [q, setQ] = useState("");
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, toDollars(r.priceCents)])),
  );
  // After a save, the saved values become the new baseline.
  const [baseline, setBaseline] = useState<Record<string, string>>(values);
  const [lastSaved, setLastSaved] = useState<BulkPriceState | null>(null);
  if (state !== lastSaved && state.saved != null && !state.error) {
    setLastSaved(state);
    setBaseline(values);
  }

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "all" || baseline[r.id] === "") &&
        (!term || r.name.toLowerCase().includes(term) || r.brand.toLowerCase().includes(term)),
    );
  }, [rows, filter, q, baseline]);
  const dirty = rows.filter((r) => (values[r.id] ?? "") !== (baseline[r.id] ?? "")).length;

  return (
    <form action={action} onSubmit={keep}>
      <div className="price-toolbar">
        <div className="admin-search" style={{ flex: 1, marginBottom: 0 }}>
          <label className="admin-search__field">
            <input type="search" placeholder="Filter by title or brand" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter" />
          </label>
        </div>
        <select className="price-toolbar__select" value={filter} onChange={(e) => setFilter(e.target.value as "all" | "unpriced")} aria-label="Show">
          <option value="all">All in stock</option>
          <option value="unpriced">No price yet</option>
        </select>
        <button className="admin-btn admin-btn--primary" type="submit" disabled={pending || dirty === 0}>
          {pending ? "Saving…" : dirty ? `Save ${dirty} change${dirty > 1 ? "s" : ""}` : "Save"}
        </button>
      </div>
      {state.error && (
        <p className="admin-form__error" role="alert">
          {state.error}
        </p>
      )}
      {state.saved != null && !state.error && dirty === 0 && (
        <p className="admin-hint" role="status" style={{ marginBottom: "var(--space-sm)" }}>
          ✓ Saved {state.saved} price{state.saved === 1 ? "" : "s"} — live on the site.
        </p>
      )}

      {/* Every row posts, so rows hidden by the filter keep their typed values. */}
      {rows
        .filter((r) => !visible.includes(r))
        .map((r) => (
          <span key={r.id} hidden>
            <input type="hidden" name={`price:${r.id}`} value={values[r.id] ?? ""} />
            <input type="hidden" name={`orig:${r.id}`} value={baseline[r.id] ?? ""} />
          </span>
        ))}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th />
              <th>Watch</th>
              <th>Brand</th>
              <th>Status</th>
              <th style={{ width: "11rem" }}>Price (USD)</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const changed = (values[r.id] ?? "") !== (baseline[r.id] ?? "");
              return (
                <tr key={r.id} data-changed={changed || undefined}>
                  <td>
                    <span className="admin-thumb">
                      {r.thumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.thumb} alt="" />
                      )}
                    </span>
                  </td>
                  <td className="admin-table__truncate" title={r.name}>
                    {r.name}
                  </td>
                  <td>{r.brand}</td>
                  <td>
                    <span className="admin-badge" data-tone={r.status === "HOLD" ? "hold" : "active"}>
                      {r.status === "HOLD" ? "On hold" : "Available"}
                    </span>
                  </td>
                  <td>
                    <input type="hidden" name={`orig:${r.id}`} value={baseline[r.id] ?? ""} />
                    <label className="price-cell">
                      <span aria-hidden="true">$</span>
                      <input
                        name={`price:${r.id}`}
                        inputMode="decimal"
                        placeholder="On request"
                        value={values[r.id] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [r.id]: e.target.value }))}
                        aria-label={`Price for ${r.name}`}
                      />
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </form>
  );
}
