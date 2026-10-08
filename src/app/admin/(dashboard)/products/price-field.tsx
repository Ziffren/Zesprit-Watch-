"use client";

import { useState } from "react";

const toDollars = (cents: number | null) => (cents != null ? (cents / 100).toFixed(2) : "");

// Price, with an optional reduction. Off: one "Price" field. On: "Original
// price" (shown struck through on the storefront) + "Sale price" (what the
// customer pays). The storefront shows "Reduced" for 30 days after the
// reduction is set or changed — saveProduct stamps that date.
export function PriceField({
  priceCents,
  compareAtCents,
}: {
  priceCents: number | null;
  compareAtCents: number | null;
}) {
  const [onSale, setOnSale] = useState(compareAtCents != null);
  const [price, setPrice] = useState(toDollars(priceCents));
  const [original, setOriginal] = useState(toDollars(compareAtCents ?? priceCents));

  const saleNum = parseFloat(price);
  const origNum = parseFloat(original);
  const valid = !onSale || (!Number.isNaN(saleNum) && !Number.isNaN(origNum) && saleNum < origNum);
  const percentOff = onSale && valid && origNum > 0 ? Math.round((1 - saleNum / origNum) * 100) : null;

  return (
    <>
      <label className="admin-field admin-field--row admin-toggle">
        <input
          type="checkbox"
          name="on_sale"
          checked={onSale}
          onChange={(e) => {
            const next = e.target.checked;
            setOnSale(next);
            // Turning a sale on starts from the current price as the original.
            if (next && !original) setOriginal(price);
            if (next && original === price) setPrice("");
          }}
        />
        <span>Reduced price</span>
      </label>

      <div className={onSale ? "price-grid price-grid--sale" : "price-grid"}>
        {onSale && (
          <label className="admin-field">
            <span>Original price (USD)</span>
            <input
              type="number"
              name="compare_at"
              step="0.01"
              min="0"
              required
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
            />
          </label>
        )}
        <label className="admin-field">
          <span>{onSale ? "Sale price (USD)" : "Price (USD)"}</span>
          <input
            type="number"
            name="price"
            step="0.01"
            min="0"
            required={onSale}
            placeholder={onSale ? "" : "Leave blank for “Price on request”"}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
      </div>

      {onSale && (
        <p className={valid ? "admin-hint" : "admin-hint admin-hint--error"} role={valid ? undefined : "alert"}>
          {!valid
            ? "The sale price must be lower than the original price."
            : percentOff != null
              ? `${percentOff}% off — shown as “Reduced” with the original price struck through for 30 days.`
              : null}
        </p>
      )}
    </>
  );
}
