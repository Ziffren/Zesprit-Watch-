"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function CoverImageField({
  initialUrl,
  pathPrefix = "collections",
}: {
  initialUrl: string | null;
  pathPrefix?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const path = `${pathPrefix}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: uploadError } = await supabase.storage
        .from("watch-photos")
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("watch-photos").getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
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
            {busy ? "…" : "+"}
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
