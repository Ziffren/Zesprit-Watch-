"use client";

import { useMemo, useState } from "react";
import type { PickerProduct } from "@/lib/admin/queries";

export function CollectionProducts({
  allProducts,
  initialIds,
  brandName,
}: {
  allProducts: PickerProduct[];
  initialIds: string[];
  // Set when editing a brand collection — used to flag products that would
  // move here from a different brand.
  brandName: string | null;
}) {
  const [selected, setSelected] = useState<string[]>(initialIds);
  const [query, setQuery] = useState("");

  const byId = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [allProducts]);
  const selectedSet = new Set(selected);
  const selectedProducts = selected.map((id) => byId.get(id)).filter((p): p is PickerProduct => !!p);

  const term = query.trim().toLowerCase();
  const results = term
    ? allProducts
        .filter(
          (p) =>
            !selectedSet.has(p.id) &&
            (p.productName.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term))
        )
        .slice(0, 8)
    : [];

  return (
    <div className="collection-products">
      <div className="collection-products__head">
        <h2>Products</h2>
        <span className="admin-hint">{selected.length} in this collection</span>
      </div>

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
                  {brandName && p.brand !== brandName ? ` · moves here from ${p.brand}` : ""}
                </span>
              </span>
              <button
                type="button"
                className="admin-btn"
                onClick={() => {
                  setSelected((s) => [p.id, ...s]);
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

      {selectedProducts.length === 0 ? (
        <p className="admin-hint collection-products__empty">
          No products yet — search above to add some.
        </p>
      ) : (
        <ul className="collection-products__list">
          {selectedProducts.map((p) => (
            <li key={p.id}>
              <Thumb url={p.photoUrls[0]} />
              <span className="collection-products__name">
                {p.productName}
                <span className="admin-hint">{p.brand}</span>
              </span>
              <span className="admin-badge" data-tone={p.status === "AVAILABLE" ? "active" : "draft"}>
                {p.status}
              </span>
              <button
                type="button"
                className="collection-products__remove"
                aria-label={`Remove ${p.productName}`}
                onClick={() => setSelected((s) => s.filter((id) => id !== p.id))}
              >
                ×
              </button>
              <input type="hidden" name="product_ids" value={p.id} />
            </li>
          ))}
        </ul>
      )}

      {brandName && (
        <p className="admin-hint">
          A product belongs to exactly one brand — adding one here removes it from its previous brand.
        </p>
      )}
    </div>
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
