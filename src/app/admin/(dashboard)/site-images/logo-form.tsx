"use client";

import { useActionState, useRef, useState } from "react";
import { uploadPhoto } from "@/lib/upload-photo";
import type { SiteImage } from "@/lib/site-images";
import { saveSiteImage, type SaveSiteImageState } from "./actions";

// Block 6 — the site logo. One image, previewed at header size on the
// site's ivory header so transparency and sizing can be judged before saving.
export function LogoForm({ image, where, ratio }: { image: SiteImage; where: string; ratio: string }) {
  const [state, action, pending] = useActionState<SaveSiteImageState, FormData>(saveSiteImage, { error: null, savedAt: null });
  const [url, setUrl] = useState(image.imageUrl);
  const [busy, setBusy] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (state.savedAt && state.savedAt !== lastSaved) {
    setLastSaved(state.savedAt);
    setDirty(false);
  }

  async function upload(file: File) {
    setBusy(0);
    setUploadError(null);
    try {
      setUrl(await uploadPhoto(file, "site/logo", (p) => setBusy(p)));
      setDirty(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <form className="admin-panel slot-form logo-form" action={action} onChange={() => setDirty(true)}>
      <input type="hidden" name="slot" value={image.slot} />
      {url && <input type="hidden" name="imageUrls" value={url} />}

      <div className="slot-form__head">
        <svg className="slot-map" viewBox="0 0 60 64" aria-hidden="true">
          <rect x="1" y="1" width="58" height="62" rx="3" className="slot-map__page" />
          <rect x="5" y="4" width="10" height="3" rx="1" className="slot-map__nav" />
          <rect x="22" y="3" width="16" height="5" rx="1" className="slot-map__on" />
          <rect x="45" y="4" width="10" height="3" rx="1" className="slot-map__nav" />
          <rect x="5" y="11" width="50" height="14" rx="1.5" className="slot-map__off" />
          <rect x="5" y="27" width="50" height="33" rx="1.5" className="slot-map__off" />
        </svg>
        <div>
          <h2>
            <span className="slot-form__num">6</span> Logo
          </h2>
          <p className="admin-hint">{where}</p>
          <p className="admin-hint">Best: {ratio}</p>
        </div>
        <span className="admin-badge" data-tone={image.imageUrl ? "active" : "draft"}>
          {image.imageUrl ? "Showing" : "Text wordmark"}
        </span>
      </div>

      <div className="logo-form__body">
        <div className="logo-form__preview" aria-label="Header preview">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" />
          ) : (
            <span className="logo-form__placeholder">Z&rsquo;ESPRIT WATCH</span>
          )}
        </div>
        <div className="logo-form__actions">
          <button type="button" className="admin-btn" onClick={() => fileRef.current?.click()} disabled={busy != null}>
            {busy != null ? `Uploading… ${busy}%` : url ? "Replace logo" : "Upload logo"}
          </button>
          {url && (
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
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/svg+xml,image/webp,image/jpeg,image/avif"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </div>
        <label className="admin-field">
          <span>Logo description (alt)</span>
          <input name="alt" defaultValue={image.alt ?? "Z’esprit Watch"} placeholder="Z’esprit Watch" />
        </label>
      </div>

      {(uploadError || state.error) && (
        <p className="admin-form__error" role="alert">
          {uploadError ?? state.error}
        </p>
      )}

      <div className="slot-form__foot">
        <span className="admin-hint" aria-live="polite">
          {dirty ? "Unsaved changes" : state.savedAt ? "Saved — live in the header" : "Without a logo the header shows the text wordmark."}
        </span>
        <button className="admin-btn admin-btn--primary" type="submit" disabled={pending || busy != null || !dirty}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
