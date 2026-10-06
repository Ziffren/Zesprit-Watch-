"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import type { MapPoint } from "@/lib/admin/types";

// Hallmark tokens converted to sRGB 0–1 for WebGL (cobe can't read CSS vars).
// Warm sand base: in cobe's light mode land dots render as baseColor scaled
// down by mapBrightness, so this gives brass-brown dots on a pale globe
// instead of near-black ones.
const SAND: [number, number, number] = [0.95, 0.88, 0.76];
const PAPER: [number, number, number] = [0.98, 0.957, 0.927];
const BRASS: [number, number, number] = [0.648, 0.43, 0];
const OXBLOOD: [number, number, number] = [0.371, 0.102, 0.099];

function toAngles(lat: number, lng: number): [number, number] {
  return [Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180];
}

// Depth of a lat/lng point after cobe's own rotation (same math as its
// marker vertex shader). cobe only hides back-side markers that project
// inside the disk, so ones just past the limb leak out — cull them here.
function facingDepth(lat: number, lng: number, phi: number, theta: number): number {
  const r = (lat * Math.PI) / 180;
  const a = (lng * Math.PI) / 180 - Math.PI;
  const x = -Math.cos(r) * Math.cos(a);
  const y = Math.sin(r);
  const z = Math.cos(r) * Math.sin(a);
  return -Math.sin(phi) * Math.cos(theta) * x + Math.sin(theta) * y + Math.cos(phi) * Math.cos(theta) * z;
}

export function LiveGlobe({ points }: { points: MapPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const maxVisitors = Math.max(1, ...points.map((p) => p.visitors));
    const top = points[0];
    let [phi, theta] = top ? toAngles(top.latitude, top.longitude) : [0, 0.3];
    theta = Math.max(-0.6, Math.min(0.6, theta));

    let width = canvas.offsetWidth;
    let dragStartX: number | null = null;
    let dragPhi = 0;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi,
      theta,
      dark: 0,
      diffuse: 1.1,
      mapSamples: 16000,
      mapBrightness: 0.6,
      mapBaseBrightness: 0,
      markerElevation: 0,
      baseColor: SAND,
      markerColor: BRASS,
      glowColor: PAPER,
      markers: [],
    });

    const allMarkers = points.map((p) => ({
      lat: p.latitude,
      lng: p.longitude,
      marker: {
        location: [p.latitude, p.longitude] as [number, number],
        size: 0.03 + 0.07 * (p.visitors / maxVisitors),
        color: p.liveVisitors > 0 ? OXBLOOD : BRASS,
      },
    }));
    let visibleKey = "";

    let frame = 0;
    const tick = () => {
      if (dragStartX === null && !reduceMotion) phi += 0.0025;
      const currentPhi = phi + dragPhi;
      const visible = allMarkers.filter((m) => facingDepth(m.lat, m.lng, currentPhi, theta) > 0.3);
      const key = visible.map((m) => `${m.lat},${m.lng}`).join("|");
      if (key !== visibleKey) {
        visibleKey = key;
        globe.update({ markers: visible.map((m) => m.marker) });
      }
      globe.update({ phi: currentPhi, width: width * 2, height: width * 2 });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onResize = () => {
      width = canvas.offsetWidth;
    };
    const onDown = (e: PointerEvent) => {
      dragStartX = e.clientX - dragPhi * 200;
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (dragStartX !== null) dragPhi = (e.clientX - dragStartX) / 200;
    };
    const onUp = () => {
      dragStartX = null;
      canvas.style.cursor = "grab";
    };

    window.addEventListener("resize", onResize);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(frame);
      globe.destroy();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [points]);

  const liveTotal = points.reduce((sum, p) => sum + p.liveVisitors, 0);

  return (
    <div className="live-globe">
      <canvas
        ref={canvasRef}
        className="live-globe__canvas"
        role="img"
        aria-label={`Globe of visitor locations, last 30 days: ${points.length} locations, ${liveTotal} visitors live now. The Sessions by location list has the same data as text.`}
      />
      <div className="live-globe__legend">
        <span>
          <i style={{ background: "var(--color-accent-2)" }} /> Live now
        </span>
        <span>
          <i style={{ background: "var(--color-accent)" }} /> Last 30 days
        </span>
      </div>
      {points.length === 0 && (
        <p className="admin-hint live-globe__empty">No located visits in the last 30 days yet.</p>
      )}
    </div>
  );
}
