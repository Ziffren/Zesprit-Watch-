"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkPhoto, uploadPhoto } from "@/lib/upload-photo";
import { SITE_IMAGE_SLOTS } from "@/lib/site-images";
import { saveSiteImagesBulk } from "./actions";

type Item = {
  id: string;
  name: string;
  preview: string;
  aspect: number | null;
  slot: number | null;
  alt: string;
  progress: number; // 0–100
  url: string | null;
  error: string | null;
};

const MAX = SITE_IMAGE_SLOTS.length;
const CONCURRENCY = 3;
const DEFAULT_ALT = "Vintage watch at Z’esprit Watch";

const slotLabel = (n: number) => SITE_IMAGE_SLOTS.find((s) => s.slot === n)?.label ?? `Area ${n}`;

function readAspect(src: string): Promise<number | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalHeight ? img.naturalWidth / img.naturalHeight : null);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Best area for each photo by shape: empty areas first, then the rest,
// never two photos in one area. Distance is in log space so 2:1 vs 3:1 and
// 1:2 vs 1:3 weigh the same.
function assignSlots(aspects: (number | null)[], taken: Set<number>, filled: Set<number>): (number | null)[] {
  const used = new Set(taken);
  return aspects.map((a) => {
    const free = SITE_IMAGE_SLOTS.filter((s) => !used.has(s.slot));
    if (free.length === 0) return null;
    const score = (s: (typeof SITE_IMAGE_SLOTS)[number]) =>
      (a ? Math.abs(Math.log(a / s.aspect)) : 0) + (filled.has(s.slot) ? 0.6 : 0);
    const best = free.reduce((x, y) => (score(y) < score(x) ? y : x));
    used.add(best.slot);
    return best.slot;
  });
}

// Pick or drop up to five photos; each uploads with its own progress bar and
// lands in the area whose shape fits best (changeable). "Save all" puts them
// on the homepage in one go.
export function BulkUpload({ filled }: { filled: number[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [saving, startSaving] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const filledSet = new Set(filled);

  const patch = (id: string, p: Partial<Item>) => setItems((all) => all.map((it) => (it.id === id ? { ...it, ...p } : it)));

  async function addFiles(list: FileList | File[]) {
    setError(null);
    setNotice(null);
    const room = MAX - items.length;
    const files = [...list];
    const problems = files.map((f) => checkPhoto(f)).filter((p): p is string => Boolean(p));
    const ok = files.filter((f) => !checkPhoto(f)).slice(0, Math.max(0, room));
    const skipped = files.length - problems.length - ok.length;
    const notes = [...problems];
    if (skipped > 0) notes.push(`${skipped} photo${skipped === 1 ? "" : "s"} skipped — there are only ${MAX} image areas.`);
    if (notes.length) setNotice(notes.join(" "));
    if (ok.length === 0) return;

    const previews = ok.map((f) => URL.createObjectURL(f));
    const aspects = await Promise.all(previews.map(readAspect));
    const slots = assignSlots(aspects, new Set(items.map((i) => i.slot).filter((s): s is number => s != null)), filledSet);
    const fresh: Item[] = ok.map((f, i) => ({
      id: crypto.randomUUID(),
      name: f.name,
      preview: previews[i],
      aspect: aspects[i],
      slot: slots[i],
      alt: DEFAULT_ALT,
      progress: 0,
      url: null,
      error: null,
    }));
    setItems((all) => [...all, ...fresh]);

    // Upload, a few at a time.
    const queue = fresh.map((it, i) => ({ it, file: ok[i] }));
    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const { it, file } = job;
        try {
          const url = await uploadPhoto(file, `site/slot-${it.slot ?? "x"}`, (p) => patch(it.id, { progress: p }));
          patch(it.id, { url, progress: 100 });
        } catch (err) {
          patch(it.id, { error: err instanceof Error ? err.message : "Upload failed." });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
  }

  function remove(id: string) {
    setItems((all) => {
      const it = all.find((x) => x.id === id);
      if (it) URL.revokeObjectURL(it.preview);
      return all.filter((x) => x.id !== id);
    });
  }

  const ready = items.filter((i) => i.url && i.slot != null && !i.error);
  const uploading = items.some((i) => !i.url && !i.error);
  const slotCounts = new Map<number, number>();
  for (const i of items) if (i.slot != null) slotCounts.set(i.slot, (slotCounts.get(i.slot) ?? 0) + 1);
  const clash = [...slotCounts.values()].some((n) => n > 1);

  function saveAll() {
    setError(null);
    startSaving(async () => {
      const res = await saveSiteImagesBulk(ready.map((i) => ({ slot: i.slot!, imageUrl: i.url!, alt: i.alt })));
      if (res.error) return setError(res.error);
      setNotice(`${ready.length} photo${ready.length === 1 ? "" : "s"} saved — live on the homepage.`);
      items.forEach((i) => URL.revokeObjectURL(i.preview));
      setItems([]);
      router.refresh();
    });
  }

  return (
    <section className="admin-panel bulk-upload" aria-labelledby="bulk-upload-title">
      <div className="bulk-upload__head">
        <h2 id="bulk-upload-title">Bulk upload</h2>
        <p className="admin-hint">
          Choose up to {MAX} photos at once. Each goes to the area whose shape fits best — change it if you like — then
          save them all together.
        </p>
      </div>

      {items.length < MAX && (
        <button
          type="button"
          className="bulk-upload__drop"
          data-over={over || undefined}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
            <path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            <strong>Drop photos here</strong> or click to choose · {MAX - items.length} more
          </span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {items.length > 0 && (
        <ul className="bulk-upload__list">
          {items.map((it) => {
            const dupe = it.slot != null && (slotCounts.get(it.slot) ?? 0) > 1;
            return (
              <li key={it.id} className="bulk-item" data-error={it.error ? true : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="bulk-item__thumb" src={it.preview} alt="" />
                <div className="bulk-item__main">
                  <p className="bulk-item__name">
                    {it.name}
                    {it.aspect && <span className="admin-hint"> · {it.aspect.toFixed(2)}:1</span>}
                  </p>
                  {it.error ? (
                    <p className="admin-form__error">{it.error}</p>
                  ) : (
                    <div className="bulk-item__progress" role="progressbar" aria-valuenow={it.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${it.name}`}>
                      <span style={{ width: `${it.progress}%` }} />
                      <em>{it.url ? "Uploaded" : `${it.progress}%`}</em>
                    </div>
                  )}
                  <div className="bulk-item__fields">
                    <label className="admin-field">
                      <span>Area</span>
                      <select
                        value={it.slot ?? ""}
                        onChange={(e) => patch(it.id, { slot: e.target.value ? Number(e.target.value) : null })}
                        aria-invalid={dupe || undefined}
                      >
                        <option value="">— Choose —</option>
                        {SITE_IMAGE_SLOTS.map((s) => (
                          <option key={s.slot} value={s.slot}>
                            {s.slot}. {s.label}
                            {filledSet.has(s.slot) ? " (replaces current)" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-field">
                      <span>Description (alt)</span>
                      <input value={it.alt} onChange={(e) => patch(it.id, { alt: e.target.value })} maxLength={300} />
                    </label>
                  </div>
                  {dupe && <p className="admin-form__error">Another photo is also set for {slotLabel(it.slot!)}.</p>}
                </div>
                <button type="button" className="admin-btn admin-btn--ghost bulk-item__remove" onClick={() => remove(it.id)} aria-label={`Remove ${it.name}`}>
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {(notice || error) && (
        <p className={error ? "admin-form__error" : "admin-hint bulk-upload__notice"} role={error ? "alert" : "status"}>
          {error ?? notice}
        </p>
      )}

      {items.length > 0 && (
        <div className="bulk-upload__foot">
          <span className="admin-hint" aria-live="polite">
            {uploading ? "Uploading…" : `${ready.length} of ${items.length} ready`}
          </span>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={saveAll}
            disabled={saving || uploading || clash || ready.length === 0 || items.some((i) => i.slot == null && !i.error)}
          >
            {saving ? "Saving…" : `Save all (${ready.length})`}
          </button>
        </div>
      )}
    </section>
  );
}
