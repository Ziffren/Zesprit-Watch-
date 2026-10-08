"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type Option = { id: string; name: string };

// Shopify-style "Collections" box: chips for what's chosen + an
// "Add collections" dropdown with search. Exactly one brand collection is
// required (picking another brand replaces it); themed collections are
// multi-select. Writes the same fields saveProduct already reads:
// brand_collection_id + collection_ids[].
export function CollectionsField({
  brands,
  themes,
  initialBrandId,
  initialThemeIds,
}: {
  brands: Option[];
  themes: Option[];
  initialBrandId: string | null;
  initialThemeIds: string[];
}) {
  const labelId = useId();
  const [brandId, setBrandId] = useState<string | null>(initialBrandId);
  const [themeIds, setThemeIds] = useState<string[]>(initialThemeIds);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const brand = brands.find((b) => b.id === brandId) ?? null;
  const chosenThemes = themes.filter((t) => themeIds.includes(t.id));

  const q = query.trim().toLowerCase();
  const visibleBrands = useMemo(() => brands.filter((b) => b.name.toLowerCase().includes(q)), [brands, q]);
  const visibleThemes = useMemo(() => themes.filter((t) => t.name.toLowerCase().includes(q)), [themes, q]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // A hidden input can't be `required`, so block the submit ourselves when
  // no brand is chosen and say why, instead of the server throwing.
  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const onSubmit = (e: SubmitEvent) => {
      const submitter = e.submitter as HTMLButtonElement | null;
      if (submitter?.formAction && submitter.formAction !== form.action) return; // e.g. Delete
      if (!brandId) {
        e.preventDefault();
        setError("Choose a brand collection.");
        setOpen(true);
      }
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [brandId]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function pickBrand(id: string) {
    setBrandId(id);
    setError(null);
  }

  function toggleTheme(id: string) {
    setThemeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  return (
    <div className="admin-field" ref={rootRef}>
      <span id={labelId}>Collections</span>

      <div className="coll-picker" data-invalid={error ? true : undefined}>
        <div className="coll-picker__box" role="group" aria-labelledby={labelId}>
          {brand && (
            <span className="coll-chip coll-chip--brand">
              <span className="coll-chip__tag">Brand</span>
              {brand.name}
              <button type="button" aria-label={`Remove ${brand.name}`} onClick={() => setBrandId(null)}>
                ×
              </button>
            </span>
          )}
          {chosenThemes.map((t) => (
            <span className="coll-chip" key={t.id}>
              {t.name}
              <button type="button" aria-label={`Remove ${t.name}`} onClick={() => toggleTheme(t.id)}>
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            className="coll-picker__add"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => (open ? close() : setOpen(true))}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5.25v5.5M5.25 8h5.5" strokeLinecap="round" />
            </svg>
            Add collections
          </button>
        </div>

        {open && (
          <div className="coll-picker__menu">
            <input
              autoFocus
              type="search"
              className="coll-picker__search"
              placeholder="Search collections"
              aria-label="Search collections"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault(); // don't submit the product form
              }}
            />
            <div className="coll-picker__list">
              <p className="coll-picker__group">Brand · choose one</p>
              {brands.length === 0 && <p className="coll-picker__empty">No brand collections yet — create one in Collections.</p>}
              {brands.length > 0 && visibleBrands.length === 0 && <p className="coll-picker__empty">No matching brand.</p>}
              <div role="listbox" aria-label="Brand collection">
                {visibleBrands.map((b) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={b.id === brandId}
                    className="coll-picker__option"
                    key={b.id}
                    onClick={() => pickBrand(b.id)}
                  >
                    <span className="coll-picker__mark coll-picker__mark--radio" aria-hidden="true" />
                    {b.name}
                  </button>
                ))}
              </div>

              <p className="coll-picker__group">Collections</p>
              {themes.length === 0 && <p className="coll-picker__empty">No themed collections yet.</p>}
              {themes.length > 0 && visibleThemes.length === 0 && <p className="coll-picker__empty">No matching collection.</p>}
              <div role="listbox" aria-label="Collections" aria-multiselectable="true">
                {visibleThemes.map((t) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={themeIds.includes(t.id)}
                    className="coll-picker__option"
                    key={t.id}
                    onClick={() => toggleTheme(t.id)}
                  >
                    <span className="coll-picker__mark coll-picker__mark--check" aria-hidden="true" />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="coll-picker__error" role="alert">
          {error}
        </p>
      )}

      {brandId && <input type="hidden" name="brand_collection_id" value={brandId} />}
      {themeIds.map((id) => (
        <input key={id} type="hidden" name="collection_ids" value={id} />
      ))}
    </div>
  );
}
