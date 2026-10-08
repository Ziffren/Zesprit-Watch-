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

// "New" / "Reduced" chips, pinned to the photo's corner.
export function PieceBadges({ isNew, isReduced }: { isNew: boolean; isReduced: boolean }) {
  if (!isNew && !isReduced) return null;
  return (
    <span className="piece-badges">
      {isReduced && <span className="piece-badge piece-badge--reduced">Reduced</span>}
      {isNew && <span className="piece-badge piece-badge--new">New</span>}
    </span>
  );
}

// Current price, with the original struck through while the piece is reduced.
export function PiecePrice({
  price,
  priceSet,
  compareAt,
  className,
}: {
  price: string;
  priceSet: boolean;
  compareAt: string | null;
  className: string;
}) {
  return (
    <p className={className} data-set={priceSet} data-reduced={compareAt ? true : undefined}>
      {compareAt && (
        <>
          <s className="piece-price__was">
            <span className="visually-hidden">Was </span>
            {compareAt}
          </s>{" "}
          <span className="visually-hidden">now </span>
        </>
      )}
      <span className="piece-price__now">{price}</span>
    </p>
  );
}

// Homepage row card: photo in an organic "blob" frame, title, brand, price.
// The whole card is one link; the blob shape varies per position (CSS).
export function ShopRowCard({ piece }: { piece: StorefrontPiece }) {
  return (
    <Link className="row-card" href={`/watches/${piece.id}`}>
      <span className="row-card__media">
        {piece.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={piece.imageUrl} alt="" loading="lazy" />
        ) : (
          <WatchIcon hour={piece.hour} min={piece.min} />
        )}
        <PieceBadges isNew={piece.isNew} isReduced={piece.isReduced} />
      </span>
      <span className="row-card__title">{piece.name}</span>
      <span className="row-card__brand">{piece.brand}</span>
      <PiecePrice className="row-card__price" price={piece.price} priceSet={piece.priceSet} compareAt={piece.compareAt} />
    </Link>
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
        <PieceBadges isNew={piece.isNew} isReduced={piece.isReduced} />
      </div>
      <div className="product__meta">
        <Heading className="product__name">{piece.name}</Heading>
        <p className="product__detail">{piece.detail}</p>
        <PiecePrice className="product__price" price={piece.price} priceSet={piece.priceSet} compareAt={piece.compareAt} />
      </div>
      <Link className="product__view" href={`/watches/${piece.id}`}>
        View piece →
      </Link>
    </article>
  );
}
