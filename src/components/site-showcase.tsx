import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteImage } from "@/lib/site-images";

function MaybeLink({ href, className, children }: { href: string | null; className: string; children: ReactNode }) {
  if (!href) return <div className={className}>{children}</div>;
  const external = /^https?:\/\//i.test(href);
  return external ? (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

// Slot 1 — full-width hero photograph with the headline set over it.
// Without an image the homepage keeps its typographic hero instead.
export function HeroBanner({ image }: { image: SiteImage }) {
  if (!image.imageUrl) return null;
  return (
    <section className="hero-banner" aria-label="Featured">
      <Image
        className="hero-banner__img"
        src={image.imageUrl}
        alt={image.alt ?? ""}
        fill
        priority
        quality={90}
        sizes="100vw"
      />
      <div className="hero-banner__copy">
        <h1 className="hero-banner__title">{image.heading ?? "Time, worn well."}</h1>
        {image.caption && <p className="hero-banner__caption">{image.caption}</p>}
        {image.linkUrl && (
          <MaybeLink href={image.linkUrl} className="hero-banner__cta">
            Discover →
          </MaybeLink>
        )}
      </div>
    </section>
  );
}

type TileKind = "feature" | "top" | "bottom" | "wide";

function Tile({
  image,
  kind,
  span,
}: {
  image: SiteImage;
  kind: TileKind;
  span?: "tall" | "full" | "solo" | "lead";
}) {
  const sizes =
    kind === "wide" || span === "full" || span === "solo"
      ? "(max-width: 960px) 100vw, 90rem"
      : "(max-width: 960px) 100vw, 50vw";
  return (
    <MaybeLink
      href={image.linkUrl}
      className={`showcase__tile showcase__tile--${kind}${span ? ` showcase__tile--${span}` : ""}`}
    >
      <Image src={image.imageUrl!} alt={image.alt ?? ""} fill quality={90} sizes={sizes} />
      {(image.heading || image.caption) && (
        <span className="showcase__copy">
          {image.heading && <span className="showcase__heading">{image.heading}</span>}
          {image.caption && <span className="showcase__caption">{image.caption}</span>}
        </span>
      )}
    </MaybeLink>
  );
}

// Slots 2–5 — the showcase: a large feature tile beside two stacked promo
// tiles, closed by a wide banner. Tiles without an image are left out and
// the remaining ones re-span so the grid never shows a hole.
export function Showcase({ images }: { images: Record<2 | 3 | 4 | 5, SiteImage> }) {
  const feature = images[2].imageUrl ? images[2] : null;
  const sides = ([3, 4] as const).filter((s) => images[s].imageUrl).map((s) => ({ slot: s, image: images[s] }));
  const wide = images[5].imageUrl ? images[5] : null;
  if (!feature && sides.length === 0 && !wide) return null;

  const sideSpan = sides.length === 1 ? (feature ? "tall" : "full") : undefined;

  return (
    <section className="showcase" aria-label="Showcase">
      {feature && (
        // With two side tiles the feature stretches to their height; with one,
        // the feature sets the height (4:5) and that side tile stretches.
        <Tile image={feature} kind="feature" span={sides.length === 0 ? "solo" : sides.length === 1 ? "lead" : undefined} />
      )}
      {sides.map(({ slot, image }) => (
        <Tile key={slot} image={image} kind={slot === 3 ? "top" : "bottom"} span={sideSpan} />
      ))}
      {wide && <Tile image={wide} kind="wide" />}
    </section>
  );
}
