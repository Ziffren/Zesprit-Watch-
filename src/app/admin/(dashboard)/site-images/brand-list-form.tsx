"use client";

import { useId, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { checkPhoto, uploadPhoto } from "@/lib/upload-photo";
import type { SiteImage } from "@/lib/site-images";
import { saveBrandList } from "./actions";

export type LinkOption = { label: string; href: string };

type Row = {
  id: string;
  url: string; // public URL, or blob: preview while uploading
  label: string;
  href: string;
  status: "done" | "uploading" | "error";
  progress: number;
  error?: string;
};

const CUSTOM = "__custom__";

function TileRow({
  row,
  index,
  options,
  nameRequired,
  onPatch,
  onRemove,
}: {
  row: Row;
  index: number;
  options: LinkOption[];
  nameRequired: boolean;
  onPatch: (p: Partial<Row>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const known = options.some((o) => o.href === row.href);
  const [custom, setCustom] = useState(!known && row.href !== "");

  return (
    <li
      ref={setNodeRef}
      className="brand-row"
      data-dragging={isDragging || undefined}
      data-status={row.status}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button type="button" className="brand-row__handle" aria-label={`Move tile ${index + 1} — press Space, then arrow keys`} {...attributes} {...listeners}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          {[4, 8, 12].flatMap((y) => [5, 11].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="currentColor" />))}
        </svg>
        <span className="brand-row__num">{index + 1}</span>
      </button>

      <div className="brand-row__thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={row.url} alt="" draggable={false} />
        {row.status === "uploading" && <span className="brand-row__pct">{row.progress}%</span>}
        {row.status === "error" && <span className="brand-row__pct brand-row__pct--error" title={row.error}>Failed</span>}
      </div>

      <div className="brand-row__fields">
        <label className="admin-field">
          <span>Link to</span>
          <select
            value={custom ? CUSTOM : known ? row.href : ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === CUSTOM) return setCustom(true);
              setCustom(false);
              const opt = options.find((o) => o.href === v);
              // Picking a collection also names a brand tile, unless a name was typed.
              onPatch({ href: v, ...(opt && nameRequired && !row.label.trim() ? { label: opt.label } : {}) });
            }}
          >
            <option value="">— No link —</option>
            {options.map((o) => (
              <option key={o.href} value={o.href}>
                {o.label}
              </option>
            ))}
            <option value={CUSTOM}>Custom link…</option>
          </select>
        </label>
        {custom && (
          <label className="admin-field">
            <span>Custom link</span>
            <input value={row.href} onChange={(e) => onPatch({ href: e.target.value })} placeholder="/collections/… or https://…" />
          </label>
        )}
        <label className="admin-field">
          <span>{nameRequired ? "Name shown" : "Title (optional)"}</span>
          <input
            value={row.label}
            onChange={(e) => onPatch({ label: e.target.value })}
            maxLength={60}
            placeholder={nameRequired ? "e.g. Credor" : "e.g. Free worldwide shipping"}
          />
        </label>
      </div>

      <button type="button" className="admin-btn admin-btn--ghost brand-row__remove" onClick={onRemove} aria-label={`Remove tile ${index + 1}`}>
        ×
      </button>
    </li>
  );
}

// Block 2 — "Shopping Brand List". Upload several square photos at once;
// each becomes a tile with a name + link. Drag to set the order shown on
// the homepage.
export function BrandListForm({
  image,
  options,
  where,
  ratio,
  variant = "brands",
}: {
  image: SiteImage;
  options: LinkOption[];
  where: string;
  ratio: string;
  /** "info" = block 7 Zesprit Info: optional names, no View all button. */
  variant?: "brands" | "info";
}) {
  const info = variant === "info";
  const dndId = useId();
  const [rows, setRows] = useState<Row[]>(
    image.items.map((t, i) => ({ id: `${i}-${t.url}`, url: t.url, label: t.label, href: t.href, status: "done", progress: 100 })),
  );
  const [heading, setHeading] = useState(image.heading ?? "");
  const [linkUrl, setLinkUrl] = useState(image.linkUrl ?? "");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [saving, startSaving] = useTransition();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const patch = (id: string, p: Partial<Row>) => {
    setRows((all) => all.map((r) => (r.id === id ? { ...r, ...p } : r)));
    setDirty(true);
  };

  async function addFiles(files: File[]) {
    const problems = files.map(checkPhoto).filter((p): p is string => Boolean(p));
    const ok = files.filter((f) => !checkPhoto(f));
    setMessage(problems.length ? { kind: "error", text: problems.join(" ") } : null);
    const fresh: (Row & { file: File })[] = ok.map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      label: "",
      href: "",
      status: "uploading",
      progress: 0,
      file,
    }));
    if (fresh.length === 0) return;
    setRows((all) => [...all, ...fresh.map((r) => ({ id: r.id, url: r.url, label: r.label, href: r.href, status: r.status, progress: r.progress }))]);
    setDirty(true);
    const queue = [...fresh];
    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const { id, file, url: preview } = job;
        try {
          const url = await uploadPhoto(file, info ? "site/info" : "site/brands", (progress) => patch(id, { progress }));
          URL.revokeObjectURL(preview);
          patch(id, { url, status: "done", progress: 100 });
        } catch (err) {
          patch(id, { status: "error", error: err instanceof Error ? err.message : "Upload failed." });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, queue.length) }, worker));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setRows((all) => arrayMove(all, all.findIndex((r) => r.id === active.id), all.findIndex((r) => r.id === over.id)));
    setDirty(true);
  }

  const uploading = rows.some((r) => r.status === "uploading");
  const failed = rows.some((r) => r.status === "error");

  function save() {
    setMessage(null);
    startSaving(async () => {
      const res = await saveBrandList({
        slot: image.slot,
        heading,
        linkUrl,
        items: rows.filter((r) => r.status === "done").map((r) => ({ url: r.url, label: r.label, href: r.href })),
      });
      if (res.error) return setMessage({ kind: "error", text: res.error });
      setDirty(false);
      setMessage({ kind: "ok", text: "Saved — live on the homepage" });
    });
  }

  return (
    <section className="admin-panel slot-form brand-list-form" aria-labelledby={`tile-block-${image.slot}`}>
      <div className="slot-form__head">
        {info ? (
          <svg className="slot-map" viewBox="0 0 60 64" aria-hidden="true">
            <rect x="1" y="1" width="58" height="62" rx="3" className="slot-map__page" />
            <rect x="5" y="4" width="50" height="3" rx="1" className="slot-map__nav" />
            <rect x="5" y="9" width="50" height="14" rx="1.5" className="slot-map__off" />
            <rect x="5" y="25" width="50" height="20" rx="1.5" className="slot-map__off" />
            {[0, 1, 2].map((i) => (
              <rect key={i} x={5 + i * 17} y="48" width="16" height="9" rx="1" className="slot-map__on" />
            ))}
          </svg>
        ) : (
          <svg className="slot-map" viewBox="0 0 60 64" aria-hidden="true">
            <rect x="1" y="1" width="58" height="62" rx="3" className="slot-map__page" />
            <rect x="5" y="4" width="50" height="3" rx="1" className="slot-map__nav" />
            <rect x="5" y="9" width="50" height="14" rx="1.5" className="slot-map__off" />
            <rect x="5" y="25" width="50" height="7" rx="1.5" className="slot-map__row" />
            <rect x="5" y="34" width="24" height="6" rx="1.5" className="slot-map__off" />
            <rect x="31" y="34" width="24" height="6" rx="1.5" className="slot-map__off" />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={5 + i * 10.2} y="42" width="8.6" height="8.6" rx="1" className="slot-map__on" />
            ))}
            <rect x="5" y="53" width="50" height="7" rx="1.5" className="slot-map__off" />
          </svg>
        )}
        <div>
          <h2 id={`tile-block-${image.slot}`}>
            <span className="slot-form__num">{image.slot}</span> {info ? "Zesprit Info" : "Brand List"}
          </h2>
          <p className="admin-hint">{where}</p>
          <p className="admin-hint">Best: {ratio}</p>
        </div>
        <span className="admin-badge" data-tone={image.items.length ? "active" : "draft"}>
          {image.items.length ? `${image.items.length} tiles` : "Empty"}
        </span>
      </div>

      <div className="brand-list-form__top">
        <label className="admin-field">
          <span>Section title</span>
          <input
            value={heading}
            onChange={(e) => {
              setHeading(e.target.value);
              setDirty(true);
            }}
            placeholder={info ? "The Z’esprit promise (optional)" : "Shopping Brand List"}
          />
        </label>
        {!info && (
        <label className="admin-field">
          <span>“View all” link</span>
          <input
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value);
              setDirty(true);
            }}
            placeholder="/collections/all"
          />
        </label>
        )}
      </div>

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <ol className="brand-list-form__rows">
            {rows.map((r, i) => (
              <TileRow
                key={r.id}
                row={r}
                index={i}
                options={options}
                nameRequired={!info}
                onPatch={(p) => patch(r.id, p)}
                onRemove={() => {
                  if (r.url.startsWith("blob:")) URL.revokeObjectURL(r.url);
                  setRows((all) => all.filter((x) => x.id !== r.id));
                  setDirty(true);
                }}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <label
        className="brand-list-form__add"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) addFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <span>
          <strong>{info ? "+ Add info images" : "+ Add brand photos"}</strong> — choose several at once, or drop them here
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) addFiles(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </label>

      {message && (
        <p className={message.kind === "error" ? "admin-form__error" : "admin-hint"} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}

      <div className="slot-form__foot">
        <span className="admin-hint" aria-live="polite">
          {uploading ? "Uploading…" : failed ? "Remove failed photos before saving." : dirty ? "Unsaved changes" : "Drag ⠿ to change the order shown on the site."}
        </span>
        <button className="admin-btn admin-btn--primary" type="button" onClick={save} disabled={saving || uploading || failed || !dirty}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </section>
  );
}
