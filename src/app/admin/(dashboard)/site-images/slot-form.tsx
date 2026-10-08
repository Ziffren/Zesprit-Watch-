"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { uploadPhoto } from "@/lib/upload-photo";
import type { SiteImage } from "@/lib/site-images";
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
      <rect x="5" y="34" width="24" height="18" rx="1.5" className={slot === 2 ? "slot-map__on" : "slot-map__off"} />
      <rect x="31" y="34" width="24" height="8" rx="1.5" className={slot === 3 ? "slot-map__on" : "slot-map__off"} />
      <rect x="31" y="44" width="24" height="8" rx="1.5" className={slot === 4 ? "slot-map__on" : "slot-map__off"} />
      <rect x="5" y="54" width="50" height="6" rx="1.5" className={slot === 5 ? "slot-map__on" : "slot-map__off"} />
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
  const [url, setUrl] = useState(image.imageUrl);
  const [busy, setBusy] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // A successful save clears the dirty flag (state change, not an effect).
  if (state.savedAt && state.savedAt !== lastSaved) {
    setLastSaved(state.savedAt);
    setDirty(false);
  }

  async function upload(file: File) {
    setBusy(0);
    setUploadError(null);
    try {
      setUrl(await uploadPhoto(file, `site/slot-${image.slot}`, (p) => setBusy(p)));
      setDirty(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <form className="admin-panel slot-form" action={action} onChange={() => setDirty(true)}>
      <input type="hidden" name="slot" value={image.slot} />
      <input type="hidden" name="imageUrl" value={url ?? ""} />

      <div className="slot-form__head">
        <SlotMap slot={image.slot} />
        <div>
          <h2>
            <span className="slot-form__num">{image.slot}</span> {label}
          </h2>
          <p className="admin-hint">{where}</p>
          <p className="admin-hint">Best: {ratio}</p>
        </div>
        <span className="admin-badge" data-tone={url ? "active" : "draft"}>
          {url ? "Showing" : "Empty"}
        </span>
      </div>

      <div className="slot-form__body">
        <div className={`slot-form__preview slot-form__preview--${image.slot}`}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" />
          ) : (
            <button type="button" className="slot-form__drop" onClick={() => fileRef.current?.click()} disabled={busy != null}>
              {busy != null ? `Uploading… ${busy}%` : "+ Upload image"}
            </button>
          )}
          {url && (
            <div className="slot-form__preview-actions">
              <button type="button" className="admin-btn" onClick={() => fileRef.current?.click()} disabled={busy != null}>
                {busy != null ? `Uploading… ${busy}%` : "Replace"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={() => {
                  setUrl(null);
                  setDirty(true);
                }}
              >
                Remove
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
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

      {(uploadError || state.error) && (
        <p className="admin-form__error" role="alert">
          {uploadError ?? state.error}
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
