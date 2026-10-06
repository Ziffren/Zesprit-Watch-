"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent, type MouseEvent } from "react";
import { WatchIcon } from "@/components/product-card";

const ZOOM = 2.25;
const SWIPE_PX = 48;

// Lead photo full-width, the rest in a 2-up grid (a swipe strip on phones).
// Any photo opens a full-screen <dialog> — native focus trap + Esc — where a
// click zooms in at the pointer and moving the pointer pans the zoomed image.
export function ProductGallery({
  photos,
  name,
  hour,
  min,
}: {
  photos: string[];
  name: string;
  hour: number;
  min: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [broken, setBroken] = useState<Set<number>>(() => new Set());
  const swipe = useRef<{ x: number; moved: boolean } | null>(null);

  const count = photos.length;

  const go = useCallback(
    (delta: number) => {
      setZoomed(false);
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  function open(i: number) {
    setIndex(i);
    setZoomed(false);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  // Esc closes the dialog natively — reset zoom however it was closed.
  // (Page scroll lock is pure CSS: html:has(.lightbox[open]).)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => setZoomed(false);
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  function zoomAt(e: MouseEvent<HTMLImageElement> | PointerEvent<HTMLImageElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)),
    });
  }

  function onStagePointerDown(e: PointerEvent<HTMLDivElement>) {
    swipe.current = { x: e.clientX, moved: false };
  }

  function onStagePointerUp(e: PointerEvent<HTMLDivElement>) {
    const start = swipe.current;
    if (!start || zoomed || count < 2) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > SWIPE_PX) {
      start.moved = true;
      go(dx < 0 ? 1 : -1);
    }
  }

  function onImageClick(e: MouseEvent<HTMLImageElement>) {
    if (swipe.current?.moved) return;
    if (zoomed) {
      setZoomed(false);
    } else {
      zoomAt(e);
      setZoomed(true);
    }
  }

  function onStageClick(e: MouseEvent<HTMLDivElement>) {
    // Clicking the dark area around the photo closes, like the Esc key.
    if (e.target === e.currentTarget && !swipe.current?.moved) close();
  }

  function onTrackScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setVisible(Math.round(track.scrollLeft / track.clientWidth));
  }

  if (count === 0) {
    return (
      <div className="gallery">
        <div className="gallery__item gallery__item--empty">
          <WatchIcon hour={hour} min={min} large />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="gallery" ref={trackRef} onScroll={onTrackScroll}>
        {photos.map((src, i) => (
          <button
            key={src + i}
            type="button"
            className="gallery__item"
            onClick={() => open(i)}
            aria-label={`View photo ${i + 1} of ${count} full screen`}
            data-error={broken.has(i) || undefined}
          >
            {broken.has(i) ? (
              <WatchIcon hour={hour} min={min} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={i === 0 ? name : `${name} — photo ${i + 1}`}
                loading={i < 3 ? "eager" : "lazy"}
                onError={() => setBroken((prev) => new Set(prev).add(i))}
              />
            )}
          </button>
        ))}
      </div>
      {count > 1 && (
        <p className="gallery__count" aria-hidden="true">
          {visible + 1} / {count}
        </p>
      )}

      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label={`${name} — photos`}
        onKeyDown={(e) => {
          if (count < 2) return;
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        <div
          className="lightbox__stage"
          data-zoomed={zoomed}
          onPointerDown={onStagePointerDown}
          onPointerUp={onStagePointerUp}
          onClick={onStageClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={index}
            className="lightbox__img"
            src={photos[index]}
            alt={index === 0 ? name : `${name} — photo ${index + 1}`}
            data-zoomed={zoomed}
            style={{ transformOrigin: `${origin.x}% ${origin.y}%`, ["--zoom" as string]: ZOOM }}
            onClick={onImageClick}
            onPointerMove={(e) => zoomed && zoomAt(e)}
            draggable={false}
          />
        </div>

        <button type="button" className="lightbox__btn lightbox__close" onClick={close} aria-label="Close">
          <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
            <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        {count > 1 && (
          <>
            <button type="button" className="lightbox__btn lightbox__prev" onClick={() => go(-1)} aria-label="Previous photo">
              <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
                <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="lightbox__btn lightbox__next" onClick={() => go(1)} aria-label="Next photo">
              <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
                <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="lightbox__count" aria-live="polite">
              {index + 1} / {count}
            </p>
          </>
        )}
      </dialog>
    </>
  );
}
