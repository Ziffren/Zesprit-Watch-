"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";

type MediaItem = { id: string; url: string };

function Tile({ item, onRemove }: { item: MediaItem; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      className="admin-media-tile"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt="" />
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

// Writes straight to the shared `watches.photoUrls` string array (order =
// array order) — no separate images table, matching the existing schema.
export function MediaGrid({ initialUrls }: { initialUrls: string[] }) {
  const [items, setItems] = useState<MediaItem[]>(
    initialUrls.map((url, i) => ({ id: `${i}-${url}`, url }))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  async function handleFiles(files: FileList) {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const uploaded: MediaItem[] = [];
      for (const file of Array.from(files)) {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/\s+/g, "-")}`;
        const { error: uploadError } = await supabase.storage
          .from("watch-photos")
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("watch-photos").getPublicUrl(path);
        uploaded.push({ id: path, url: data.publicUrl });
      }
      setItems((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  return (
    <div className="admin-field">
      <span>Media</span>
      {items.map((item) => (
        <input key={item.id} type="hidden" name="photoUrls" value={item.url} />
      ))}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="admin-media-grid">
            {items.map((item) => (
              <Tile key={item.id} item={item} onRemove={(id) => setItems((p) => p.filter((i) => i.id !== id))} />
            ))}
            <label className="admin-media-add">
              {busy ? "…" : "+"}
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </SortableContext>
      </DndContext>
      {error && <p className="admin-hint" style={{ color: "var(--color-accent-2)" }}>{error}</p>}
      <p className="admin-hint">
        Drag tiles to reorder. First image is the product&rsquo;s cover. Uploads go to the
        <code> watch-photos</code> bucket shared with Watch Report.
      </p>
    </div>
  );
}
