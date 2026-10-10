"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const INTERVAL_MS = 5000;

// A block's photos, stacked and crossfading every 5 s. Pauses while hovered
// or focused, stops for good once a dot is picked, and never auto-advances
// with reduced motion. One photo renders as a plain image.
export function Slides({
  urls,
  alt,
  sizes,
  priority = false,
  className,
}: {
  urls: string[];
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const many = urls.length > 1;

  useEffect(() => {
    if (!many || paused || stopped) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => {
      // Don't spend bandwidth rotating a block nobody can see.
      if (document.hidden) return;
      setIndex((i) => (i + 1) % urls.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [many, paused, stopped, urls.length]);

  if (!many) {
    return <Image className={className} src={urls[0]} alt={alt} fill priority={priority} quality={90} sizes={sizes} />;
  }

  return (
    <div
      ref={rootRef}
      className="slides"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      {urls.map((u, i) => (
        <Image
          key={u}
          className={`slides__img${className ? ` ${className}` : ""}`}
          data-active={i === index || undefined}
          src={u}
          alt={i === index ? alt : ""}
          aria-hidden={i === index ? undefined : true}
          fill
          priority={priority && i === 0}
          quality={90}
          sizes={sizes}
        />
      ))}
      <div className="slides__dots" role="group" aria-label="Choose photo">
        {urls.map((u, i) => (
          <button
            key={u}
            type="button"
            className="slides__dot"
            aria-label={`Photo ${i + 1} of ${urls.length}`}
            aria-current={i === index || undefined}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIndex(i);
              setStopped(true);
            }}
          />
        ))}
      </div>
    </div>
  );
}
