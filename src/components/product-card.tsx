import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import type { StorefrontPiece } from "@/lib/storefront";
import { CardHeart } from "./card-heart";

// Brand name → that brand's collection, when one exists.
function BrandLink({ piece, className }: { piece: StorefrontPiece; className: string }) {
  return piece.brandSlug ? (
    <Link className={className} href={`/collections/${piece.brandSlug}`}>
      {piece.brand}
    </Link>
  ) : (
    <span className={className}>{piece.brand}</span>
  );
}

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
export function PieceBadges({
  isNew,
  isReduced,
  onHold = false,
  sold = false,
}: {
  isNew: boolean;
  isReduced: boolean;
  onHold?: boolean;
  sold?: boolean;
}) {
  if (!isNew && !isReduced && !onHold && !sold) return null;
  return (
    <span className="piece-badges">
      {sold && <span className="piece-badge piece-badge--sold">Sold</span>}
      {onHold && <span className="piece-badge piece-badge--hold">On hold</span>}
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
// Photo and title open the piece, the brand opens its collection, and the
// heart saves it; the blob shape varies per position (CSS).
export function ShopRowCard({ piece }: { piece: StorefrontPiece }) {
  const href = `/watches/${piece.id}`;
  return (
    <div className="row-card">
      <Link className="row-card__media" href={href} tabIndex={-1} aria-hidden="true">
        {piece.imageUrl ? (
          <Image
            src={piece.imageUrl}
            alt=""
            fill
            quality={85}
            sizes="(max-width: 640px) 64vw, (max-width: 960px) 42vw, 18rem"
          />
        ) : (
          <WatchIcon hour={piece.hour} min={piece.min} />
        )}
        <PieceBadges isNew={piece.isNew} isReduced={piece.isReduced} onHold={piece.onHold} sold={piece.sold} />
      </Link>
      <Link className="row-card__title" href={href}>
        {piece.name}
      </Link>
      <BrandLink piece={piece} className="row-card__brand" />
      <div className="row-card__foot">
        <PiecePrice className="row-card__price" price={piece.price} priceSet={piece.priceSet} compareAt={piece.compareAt} />
        <CardHeart watchId={piece.id} count={piece.saves} name={piece.name} />
      </div>
    </div>
  );
}

export function ProductCard({ piece, headingLevel = 3 }: { piece: StorefrontPiece; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const href = `/watches/${piece.id}`;
  return (
    <article className="product" data-sold={piece.sold || undefined}>
      <Link className="product__media" href={href} tabIndex={-1} aria-hidden="true">
        {piece.imageUrl ? (
          <Image src={piece.imageUrl} alt="" fill quality={85} sizes="(max-width: 960px) 50vw, 25vw" />
        ) : (
          <WatchIcon hour={piece.hour} min={piece.min} />
        )}
        <PieceBadges isNew={piece.isNew} isReduced={piece.isReduced} onHold={piece.onHold} sold={piece.sold} />
      </Link>
      <div className="product__meta">
        <Heading className="product__name">
          <Link href={href}>{piece.name}</Link>
        </Heading>
        <BrandLink piece={piece} className="product__detail product__brand" />
        <PiecePrice className="product__price" price={piece.price} priceSet={piece.priceSet} compareAt={piece.compareAt} />
      </div>
      <div className="product__foot">
        <Link className="product__view" href={href}>
          View piece →
        </Link>
        <CardHeart watchId={piece.id} count={piece.saves} name={piece.name} />
      </div>
    </article>
  );
}
