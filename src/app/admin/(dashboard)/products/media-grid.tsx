"use client";

import { useEffect, useId, useRef, useState } from "react";
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
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { checkPhoto, uploadPhoto } from "@/lib/upload-photo";

type MediaItem = {
  id: string;
  /** Public URL once uploaded; a local blob: preview while uploading. */
  url: string;
  status: "done" | "uploading" | "error";
  progress: number;
  error?: string;
  file?: File;
};

const CONCURRENCY = 3;

function ProgressRing({ percent }: { percent: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg className="media-progress" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r={r} className="media-progress__track" />
      <circle
        cx="22"
        cy="22"
        r={r}
        className="media-progress__bar"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - percent / 100)}
      />
    </svg>
  );
}

function Tile({
  item,
  position,
  firstLabel,
  onRemove,
  onRetry,
}: {
  item: MediaItem;
  position: number;
  firstLabel: string;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  // Every tile is sortable — including ones still uploading, so the order
  // can be arranged while photos are on their way.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      className="admin-media-tile"
      data-status={item.status}
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`Photo ${position}${position === 1 ? ` (${firstLabel.toLowerCase()})` : ""} — press Space, then arrow keys to move`}
    >
      {/* draggable=false: stops the browser's native image drag from hijacking the reorder */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt="" draggable={false} />
      <span className="media-tile__pos" aria-hidden="true">
        {position === 1 ? firstLabel : position}
      </span>

      {item.status === "uploading" && (
        <div className="media-tile__overlay" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Uploading">
          <ProgressRing percent={item.progress} />
          <span className="media-tile__pct">{item.progress}%</span>
        </div>
      )}

      {item.status === "error" && (
        <div className="media-tile__overlay media-tile__overlay--error" title={item.error}>
          <span>Failed</span>
          <button
            type="button"
            className="media-tile__retry"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRetry(item.id);
            }}
          >
            Retry
          </button>
        </div>
      )}

      <button
        type="button"
        className="admin-media-tile__remove"
        aria-label="Remove image"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
      >
        ×
      </button>
    </div>
  );
}

// Sortable photo grid — product photos (products.photoUrls, first = cover)
// and the homepage image blocks. Writes one hidden input per uploaded photo,
// in tile order. Each picked file shows instantly as a local preview with
// its own progress ring; uploads run 3 at a time and failed ones can be
// retried in place.
export function MediaGrid({
  initialUrls,
  name = "photoUrls",
  prefix = "products",
  label = "Media",
  firstLabel = "Cover",
  hint = "Drag photos to change their order — the first one is the cover. You can also drop new photos here.",
  onChange,
}: {
  initialUrls: string[];
  name?: string;
  prefix?: string;
  label?: string;
  firstLabel?: string;
  hint?: string;
  /** Called whenever the set or order of photos changes (e.g. to mark a form dirty). */
  onChange?: () => void;
}) {
  // Stable across server + client render, so dnd-kit's aria ids hydrate cleanly.
  const dndId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<MediaItem[]>(
    initialUrls.map((url, i) => ({ id: `${i}-${url}`, url, status: "done", progress: 100 })),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const queue = useRef<string[]>([]);
  const running = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Mouse: drag after 4px. Touch: press-and-hold 200ms so the page can
  // still scroll. Keyboard: Space to pick up, arrows to move, Space to drop.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const patch = (id: string, p: Partial<MediaItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));

  function pump() {
    while (running.current < CONCURRENCY && queue.current.length > 0) {
      const id = queue.current.shift()!;
      const item = itemsRef.current.find((i) => i.id === id);
      if (!item?.file) continue;
      running.current += 1;
      const file = item.file;
      uploadPhoto(file, prefix, (progress) => patch(id, { progress }))
        .then((publicUrl) => {
          URL.revokeObjectURL(item.url);
          patch(id, { url: publicUrl, status: "done", progress: 100, file: undefined });
          onChange?.();
        })
        .catch((err: unknown) => {
          patch(id, { status: "error", error: err instanceof Error ? err.message : "Upload failed." });
        })
        .finally(() => {
          running.current -= 1;
          pump();
        });
    }
  }

  function addFiles(files: File[]) {
    const problems: string[] = [];
    const fresh: MediaItem[] = [];
    for (const file of files) {
      const problem = checkPhoto(file);
      if (problem) {
        problems.push(problem);
        continue;
      }
      fresh.push({ id: crypto.randomUUID(), url: URL.createObjectURL(file), status: "uploading", progress: 0, file });
    }
    setNotice(problems.length ? problems.join(" ") : null);
    if (fresh.length === 0) return;
    setItems((prev) => [...prev, ...fresh]);
    itemsRef.current = [...itemsRef.current, ...fresh];
    queue.current.push(...fresh.map((f) => f.id));
    pump();
  }

  function retry(id: string) {
    patch(id, { status: "uploading", progress: 0, error: undefined });
    queue.current.push(id);
    pump();
  }

  function remove(id: string) {
    setItems((prev) => {
      const gone = prev.find((i) => i.id === id);
      if (gone?.url.startsWith("blob:")) URL.revokeObjectURL(gone.url);
      return prev.filter((i) => i.id !== id);
    });
    onChange?.();
    queue.current = queue.current.filter((q) => q !== id);
  }

  // Don't let the product save while photos are still on their way —
  // they'd be silently dropped from photoUrls.
  const uploading = items.some((i) => i.status === "uploading");
  const failed = items.some((i) => i.status === "error");
  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const onSubmit = (e: SubmitEvent) => {
      const submitter = e.submitter as HTMLButtonElement | null;
      if (submitter?.formAction && submitter.formAction !== form.action) return; // Delete
      if (uploading) {
        e.preventDefault();
        setNotice("Photos are still uploading — save again when they're done.");
        rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [uploading]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    onChange?.();
  }

  const doneCount = items.filter((i) => i.status === "done").length;
  const busyCount = items.filter((i) => i.status === "uploading").length;

  return (
    <div className="admin-field" ref={rootRef}>
      <span>{label}</span>
      {items
        .filter((i) => i.status === "done")
        .map((item) => (
          <input key={item.id} type="hidden" name={name} value={item.url} />
        ))}
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div
            className="admin-media-grid"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) addFiles(Array.from(e.dataTransfer.files));
            }}
          >
            {items.map((item, i) => (
              <Tile key={item.id} item={item} position={i + 1} firstLabel={firstLabel} onRemove={remove} onRetry={retry} />
            ))}
            <label className="admin-media-add">
              +
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) addFiles(Array.from(e.target.files));
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </SortableContext>
      </DndContext>
      <p className="admin-hint" aria-live="polite">
        {busyCount > 0
          ? `Uploading ${busyCount} photo${busyCount > 1 ? "s" : ""}… ${doneCount} ready.`
          : failed
            ? "Some photos failed — Retry them or remove them before saving."
            : hint}
      </p>
      {notice && (
        <p className="admin-hint admin-hint--error" role="alert">
          {notice}
        </p>
      )}
    </div>
  );
}
