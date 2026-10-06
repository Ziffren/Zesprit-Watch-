import type { CSSProperties } from "react";
import Link from "next/link";
import type { StorefrontPiece } from "@/lib/storefront";

export function WatchIcon({ hour, min, large = false }: { hour: number; min: number; large?: boolean }) {
  return (
    <div
      className={large ? "watch-icon watch-icon--large" : "watch-icon"}
      style={{ "--hour-deg": `${hour}deg`, "--min-deg": `${min}deg` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="watch-icon__hand watch-icon__hand--hour" />
      <span className="watch-icon__hand watch-icon__hand--min" />
      <span className="watch-icon__hub" />
    </div>
  );
}

export function ProductCard({ piece, headingLevel = 3 }: { piece: StorefrontPiece; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="product">
      <div className="product__media">
        {piece.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={piece.imageUrl} alt={piece.name} loading="lazy" />
        ) : (
          <WatchIcon hour={piece.hour} min={piece.min} />
        )}
      </div>
      <div className="product__meta">
        <Heading className="product__name">{piece.name}</Heading>
        <p className="product__detail">{piece.detail}</p>
        <p className="product__price" data-set={piece.priceSet}>
          {piece.price}
        </p>
      </div>
      <Link className="product__view" href={`/watches/${piece.id}`}>
        View piece →
      </Link>
    </article>
  );
}
