import { notFound } from "next/navigation";
import Link from "next/link";
import { getRelatedPieces, getWatchDetail } from "@/lib/storefront";
import { formatPrice } from "@/lib/admin/types";
import { PieceBadges, PiecePrice, ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { OrderForm } from "./order-form";
import { SaveButton } from "./save-button";
import { ProductGallery } from "./product-gallery";

export default async function WatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const watch = await getWatchDetail(id);

  if (!watch) notFound();

  const related = await getRelatedPieces(watch.brand, watch.id);

  return (
    <>
      <SiteHeader active="watches" />

      <main>
        <section className="watch-detail">
          <div className="watch-detail__media">
            <ProductGallery photos={watch.photoUrls} name={watch.name} hour={watch.hour} min={watch.min} />
          </div>

          <div className="watch-detail__info">
            <PieceBadges isNew={watch.isNew} isReduced={watch.isReduced} />
            <p className="watch-detail__brand">{watch.brand}</p>
            <h1 className="watch-detail__title">{watch.name}</h1>
            <div className="watch-detail__price-row">
              <PiecePrice
                className="watch-detail__price"
                price={formatPrice(watch.priceCents)}
                priceSet={watch.priceCents != null}
                compareAt={watch.compareAt}
              />
              <SaveButton watchId={watch.id} />
            </div>

            {watch.status === "AVAILABLE" ? (
              <OrderForm watchId={watch.id} />
            ) : (
              <div className="order-form__success">
                <p className="order-form__success-title">This piece has found its home.</p>
                <p>
                  It&rsquo;s no longer available, but{" "}
                  <Link href="/#collection">browse the current collection</Link> — new pieces
                  are added regularly.
                </p>
              </div>
            )}

            {watch.descriptionHtml && (
              <div
                className="watch-detail__description"
                dangerouslySetInnerHTML={{ __html: watch.descriptionHtml }}
              />
            )}

            {watch.tags.length > 0 && (
              <ul className="watch-detail__tags">
                {watch.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {related.pieces.length > 0 && (
          <section className="related" aria-labelledby="related-title">
            <h2 className="related__title" id="related-title">
              {related.sameBrand ? `More from ${watch.brand}` : "More from the collection"}
            </h2>
            <div className="related__grid">
              {related.pieces.map((p) => (
                <ProductCard key={p.id} piece={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="foot-mast">
        <p className="wordmark">Z&rsquo;esprit Watch</p>
        <p className="tagline muted">Vintage watches, restored to keep time again.</p>
        <p className="links muted">
          <Link href="/journal">Journal</Link> · Care Guide · <Link href="/contact">Contact</Link>
        </p>
      </footer>
    </>
  );
}
