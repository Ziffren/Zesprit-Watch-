"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { PickerProduct } from "@/lib/admin/queries";
import {
  RULE_FIELDS,
  defaultRule,
  matchesCollection,
  type Rule,
  type RuleField,
} from "@/lib/collection-rules";

export type CollectionType = "manual" | "brand" | "smart";
type SortKey = "newest" | "oldest" | "name" | "priceDesc" | "priceAsc";

const PAGE = 60;

function formatPrice(cents: number | null) {
  if (cents == null) return "Price on request";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function CollectionBuilder({
  allProducts,
  initialType,
  initialMatchAll,
  initialRules,
  initialExcludeRules,
  initialManualIds,
  savedName,
  now,
  header,
  actions,
}: {
  allProducts: PickerProduct[];
  initialType: CollectionType;
  initialMatchAll: boolean;
  initialRules: Rule[];
  initialExcludeRules: Rule[];
  initialManualIds: string[];
  savedName: string | null;
  // Server render time, so date-based conditions preview against the same
  // clock the server used for counts.
  now: number;
  header: ReactNode;
  actions: ReactNode;
}) {
  const [type, setType] = useState<CollectionType>(initialType);
  const [matchAll, setMatchAll] = useState(initialMatchAll);
  const [rules, setRules] = useState<Rule[]>(initialRules.length ? initialRules : [defaultRule()]);
  const [excludeRules, setExcludeRules] = useState<Rule[]>(initialExcludeRules);
  const [manualIds, setManualIds] = useState<string[]>(initialManualIds);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortKey>("newest");
  const [shown, setShown] = useState(PAGE);

  const byId = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [allProducts]);

  const items = useMemo(() => {
    const list =
      type === "smart"
        ? allProducts.filter((p) => matchesCollection(p, { rules, excludeRules, matchAll }, now))
        : manualIds.map((id) => byId.get(id)).filter((p): p is PickerProduct => !!p);
    const sorted = [...list];
    const price = (p: PickerProduct, missing: number) => p.priceCents ?? missing;
    sorted.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.createdAt.localeCompare(b.createdAt);
        case "name":
          return a.productName.localeCompare(b.productName);
        case "priceDesc":
          return price(b, -1) - price(a, -1);
        case "priceAsc":
          return price(a, Infinity) - price(b, Infinity);
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });
    return sorted;
  }, [type, allProducts, rules, excludeRules, matchAll, manualIds, byId, sort, now]);

  const manualSet = new Set(manualIds);
  const term = query.trim().toLowerCase();
  const results =
    type !== "smart" && term
      ? allProducts
          .filter(
            (p) =>
              !manualSet.has(p.id) &&
              (p.productName.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term))
          )
          .slice(0, 8)
      : [];

  const canRemove = type !== "smart";

  return (
    <>
      <input type="hidden" name="collection_type" value={type} />
      <input type="hidden" name="match_all" value={matchAll ? "true" : "false"} />
      <input type="hidden" name="rules_json" value={JSON.stringify(type === "smart" ? rules : [])} />
      <input
        type="hidden"
        name="exclude_json"
        value={JSON.stringify(type === "smart" ? excludeRules : [])}
      />
      {type !== "smart" &&
        manualIds.map((id) => <input key={id} type="hidden" name="product_ids" value={id} />)}

      <div className="admin-form__main">
        {header}

        <section className="admin-panel">
          <div className="collection-items__head">
            <h2>
              Collection items <span className="collection-items__count">{items.length}</span>
            </h2>
            <div className="collection-items__tools">
              <div className="collection-items__views" role="group" aria-label="View">
                <button
                  type="button"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                >
                  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
                    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                  aria-label="List view"
                >
                  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
                    <path d="M5 4h9M5 8h9M5 12h9M2 4h.01M2 8h.01M2 12h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <select
                className="collection-items__sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Sort"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Title A–Z</option>
                <option value="priceDesc">Highest price</option>
                <option value="priceAsc">Lowest price</option>
              </select>
            </div>
          </div>

          {type !== "smart" && (
            <div className="collection-items__add">
              <input
                type="search"
                className="collection-products__search"
                placeholder="Search products to add…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search products to add"
              />
              {results.length > 0 && (
                <ul className="collection-products__results" aria-label="Search results">
                  {results.map((p) => (
                    <li key={p.id}>
                      <Thumb url={p.photoUrls[0]} />
                      <span className="collection-products__name">
                        {p.productName}
                        <span className="admin-hint">
                          {p.brand}
                          {type === "brand" && savedName && p.brand !== savedName
                            ? ` · moves here from ${p.brand}`
                            : ""}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="admin-btn"
                        onClick={() => {
                          setManualIds((s) => [p.id, ...s]);
                          setQuery("");
                        }}
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {term && results.length === 0 && (
                <p className="admin-hint">No matching products outside this collection.</p>
              )}
            </div>
          )}

          {items.length === 0 ? (
            <p className="admin-hint collection-products__empty">
              {type === "smart"
                ? "No products match these conditions yet."
                : "No products yet — search above to add some."}
            </p>
          ) : view === "grid" ? (
            <ul className="collection-grid">
              {items.slice(0, shown).map((p) => (
                <li key={p.id} className="collection-grid__card">
                  <div className="collection-grid__media">
                    {p.photoUrls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrls[0]} alt="" loading="lazy" />
                    ) : (
                      <span className="collection-grid__noimg">{p.brand}</span>
                    )}
                    {canRemove && (
                      <button
                        type="button"
                        className="collection-grid__remove"
                        aria-label={`Remove ${p.productName}`}
                        onClick={() => setManualIds((s) => s.filter((id) => id !== p.id))}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <p className="collection-grid__name">{p.productName}</p>
                  <p className="admin-hint">
                    {formatPrice(p.priceCents)} · {p.status === "AVAILABLE" ? "Available" : p.status === "HOLD" ? "On hold" : "Sold"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="collection-products__list">
              {items.slice(0, shown).map((p) => (
                <li key={p.id}>
                  <Thumb url={p.photoUrls[0]} />
                  <span className="collection-products__name">
                    {p.productName}
                    <span className="admin-hint">
                      {p.brand} · {formatPrice(p.priceCents)}
                    </span>
                  </span>
                  <span className="admin-badge" data-tone={p.status === "AVAILABLE" ? "active" : "draft"}>
                    {p.status}
                  </span>
                  {canRemove && (
                    <button
                      type="button"
                      className="collection-products__remove"
                      aria-label={`Remove ${p.productName}`}
                      onClick={() => setManualIds((s) => s.filter((id) => id !== p.id))}
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {items.length > shown && (
            <button type="button" className="admin-btn collection-items__more" onClick={() => setShown((n) => n + PAGE)}>
              Show more ({items.length - shown} left)
            </button>
          )}
        </section>
      </div>

      <div className="admin-form__side">
        <div className="admin-panel">
          <h2>Collection type</h2>
          <label className="admin-field">
            <span>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as CollectionType)}>
              <option value="manual">Manual — add products yourself</option>
              <option value="brand">Brand — one per product</option>
              <option value="smart">Automated — products match conditions</option>
            </select>
          </label>
          {type === "brand" && (
            <p className="admin-hint">
              Products pick their brand from these. Adding a product here removes it from its
              previous brand.
            </p>
          )}
        </div>

        {type === "smart" && (
          <div className="admin-panel">
            <h2>Conditions</h2>
            <div className="rule-match" role="radiogroup" aria-label="Products must match">
              <span className="admin-hint">Products must match</span>
              <label>
                <input type="radio" checked={matchAll} onChange={() => setMatchAll(true)} /> all conditions
              </label>
              <label>
                <input type="radio" checked={!matchAll} onChange={() => setMatchAll(false)} /> any condition
              </label>
            </div>

            <RuleList rules={rules} onChange={setRules} />
            <button type="button" className="admin-btn rule-add" onClick={() => setRules((r) => [...r, defaultRule()])}>
              + Add condition
            </button>

            <h3 className="rule-subhead">Exclude</h3>
            <p className="admin-hint">Products matching any of these are left out.</p>
            <RuleList rules={excludeRules} onChange={setExcludeRules} />
            <button
              type="button"
              className="admin-btn rule-add"
              onClick={() => setExcludeRules((r) => [...r, defaultRule("status")])}
            >
              + Exclude
            </button>

            <p className="rule-count">
              <strong>{items.length}</strong> product{items.length === 1 ? "" : "s"} match right now
            </p>
            {rules.length === 0 && (
              <p className="admin-hint" style={{ color: "var(--color-accent-2)" }}>
                Add at least one condition.
              </p>
            )}
          </div>
        )}

        {actions}
      </div>
    </>
  );
}

function RuleList({ rules, onChange }: { rules: Rule[]; onChange: (r: Rule[]) => void }) {
  const update = (i: number, patch: Partial<Rule>) =>
    onChange(rules.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <ul className="rule-list">
      {rules.map((r, i) => {
        const spec = RULE_FIELDS[r.field];
        const hideValue = r.field === "price" && r.op === "empty";
        return (
          <li key={i} className="rule-row">
            <select
              value={r.field}
              aria-label="Field"
              onChange={(e) => update(i, defaultRule(e.target.value as RuleField))}
            >
              {(Object.keys(RULE_FIELDS) as RuleField[]).map((f) => (
                <option key={f} value={f}>
                  {RULE_FIELDS[f].label}
                </option>
              ))}
            </select>
            <select value={r.op} aria-label="Operator" onChange={(e) => update(i, { op: e.target.value })}>
              {spec.ops.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {!hideValue &&
              (spec.input === "status" ? (
                <select value={r.value} aria-label="Value" onChange={(e) => update(i, { value: e.target.value })}>
                  <option value="AVAILABLE">Available</option>
                  <option value="HOLD">On hold</option>
                  <option value="SOLD">Sold</option>
                </select>
              ) : (
                <input
                  aria-label="Value"
                  type={spec.input === "text" ? "text" : "number"}
                  min={spec.input === "days" ? 1 : 0}
                  step={spec.input === "number" ? "0.01" : "1"}
                  value={r.value}
                  placeholder={spec.input === "text" ? "value" : "0"}
                  onChange={(e) => update(i, { value: e.target.value })}
                />
              ))}
            <button
              type="button"
              className="collection-products__remove"
              aria-label="Remove condition"
              onClick={() => onChange(rules.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Thumb({ url }: { url: string | undefined }) {
  return (
    <span className="admin-thumb">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" loading="lazy" />
      )}
    </span>
  );
}
