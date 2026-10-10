"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { SiteImage } from "@/lib/site-images";
import { MediaGrid } from "../products/media-grid";
import { saveSiteImage, type SaveSiteImageState } from "./actions";

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="admin-btn admin-btn--primary" type="submit" disabled={pending || !dirty}>
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

// Mini homepage map with this slot's area highlighted.
function SlotMap({ slot }: { slot: number }) {
  return (
    <svg className="slot-map" viewBox="0 0 60 64" aria-hidden="true">
      <rect x="1" y="1" width="58" height="62" rx="3" className="slot-map__page" />
      <rect x="5" y="4" width="50" height="3" rx="1" className="slot-map__nav" />
      <rect x="5" y="9" width="50" height="14" rx="1.5" className={slot === 1 ? "slot-map__on" : "slot-map__off"} />
      <rect x="5" y="25" width="50" height="7" rx="1.5" className="slot-map__row" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={5 + i * 10.2} y="42" width="8.6" height="8.6" rx="1" className="slot-map__off" />
      ))}
      <rect x="5" y="34" width="24" height="6" rx="1.5" className={slot === 3 ? "slot-map__on" : "slot-map__off"} />
      <rect x="31" y="34" width="24" height="6" rx="1.5" className={slot === 4 ? "slot-map__on" : "slot-map__off"} />
      <rect x="5" y="53" width="50" height="7" rx="1.5" className={slot === 5 ? "slot-map__on" : "slot-map__off"} />
    </svg>
  );
}

export function SlotForm({
  image,
  label,
  where,
  ratio,
}: {
  image: SiteImage;
  label: string;
  where: string;
  ratio: string;
}) {
  const [state, action] = useActionState<SaveSiteImageState, FormData>(saveSiteImage, { error: null, savedAt: null });
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const count = image.imageUrls.length;

  // A successful save clears the dirty flag (state change, not an effect).
  if (state.savedAt && state.savedAt !== lastSaved) {
    setLastSaved(state.savedAt);
    setDirty(false);
  }

  return (
    <form className="admin-panel slot-form" action={action} onChange={() => setDirty(true)}>
      <input type="hidden" name="slot" value={image.slot} />

      <div className="slot-form__head">
        <SlotMap slot={image.slot} />
        <div>
          <h2>
            <span className="slot-form__num">{image.slot}</span> {label}
          </h2>
          <p className="admin-hint">{where}</p>
          <p className="admin-hint">Best: {ratio}</p>
        </div>
        <span className="admin-badge" data-tone={count ? "active" : "draft"}>
          {count === 0 ? "Empty" : count === 1 ? "Showing" : `Slideshow · ${count}`}
        </span>
      </div>

      <div className="slot-form__body">
        <div className="slot-form__photos">
          <MediaGrid
            initialUrls={image.imageUrls}
            name="imageUrls"
            prefix={`site/slot-${image.slot}`}
            label="Photos"
            firstLabel="First"
            hint="Add as many photos as you like — more than one plays as a slideshow, in this order. Drag to reorder."
            onChange={() => setDirty(true)}
          />
        </div>

        <div className="slot-form__fields">
          <label className="admin-field">
            <span>Image description (alt)</span>
            <input name="alt" defaultValue={image.alt ?? ""} placeholder="e.g. Grand Seiko Snowflake on a walnut tray" />
          </label>
          <label className="admin-field">
            <span>Heading (optional)</span>
            <input name="heading" defaultValue={image.heading ?? ""} placeholder={image.slot === 1 ? "Time, worn well." : "e.g. New from Credor"} />
          </label>
          <label className="admin-field">
            <span>Caption (optional)</span>
            <input name="caption" defaultValue={image.caption ?? ""} placeholder="A short line under the heading" />
          </label>
          <label className="admin-field">
            <span>Link (optional)</span>
            <input name="linkUrl" defaultValue={image.linkUrl ?? ""} placeholder="/collections/grand-seiko" />
          </label>
        </div>
      </div>

      {state.error && (
        <p className="admin-form__error" role="alert">
          {state.error}
        </p>
      )}

      <div className="slot-form__foot">
        <span className="admin-hint" aria-live="polite">
          {dirty ? "Unsaved changes" : state.savedAt ? "Saved — live on the homepage" : ""}
        </span>
        <SaveButton dirty={dirty} />
      </div>
    </form>
  );
}
