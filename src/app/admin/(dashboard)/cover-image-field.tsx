"use client";

import { useRef, useState } from "react";
import { uploadPhoto } from "@/lib/upload-photo";

export function CoverImageField({
  initialUrl,
  pathPrefix = "collections",
}: {
  initialUrl: string | null;
  pathPrefix?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(0);
    setError(null);
    try {
      setUrl(await uploadPhoto(file, pathPrefix, (p) => setBusy(p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="admin-field">
      <span>Cover image</span>
      <input type="hidden" name="coverImageUrl" value={url ?? ""} />
      <div
        className="admin-media-tile"
        style={{ width: "8rem" }}
        onClick={() => inputRef.current?.click()}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" />
        ) : (
          <span className="admin-media-add" style={{ border: "none" }}>
            {busy != null ? `${busy}%` : "+"}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error && <p className="admin-hint" style={{ color: "var(--color-accent-2)" }}>{error}</p>}
    </div>
  );
}
