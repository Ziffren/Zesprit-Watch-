import { notFound } from "next/navigation";
import Link from "next/link";
import { getRelatedPieces, getWatchDetail } from "@/lib/storefront";
import { formatCents, formatPrice } from "@/lib/admin/types";
import { PieceBadges, PiecePrice, ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { getCustomer } from "@/lib/customer";
import { OrderForm } from "./order-form";
import { DepositForm } from "./deposit-form";
import { BuyButtons } from "./buy-buttons";
import { PieceMessageForm } from "./piece-message";
import { ShareButton } from "./share-button";
import { RequestPiece } from "./request-piece";
import { depositAmount, getShopSettings } from "@/lib/deposits";
import { QUALITY_PROMISE, SHIPPING_INFO } from "@/lib/product-info";
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

  const [related, customer, settings] = await Promise.all([
    getRelatedPieces(watch.brand, watch.id),
    getCustomer(),
    getShopSettings(),
  ]);

  return (
    <>
      <SiteHeader active="watches" />

      <main>
        <section className="watch-detail">
          <div className="watch-detail__media">
            <ProductGallery photos={watch.photoUrls} name={watch.name} hour={watch.hour} min={watch.min} />
          </div>

          <div className="watch-detail__info">
            <PieceBadges
              isNew={watch.status !== "SOLD" && watch.isNew}
              isReduced={watch.status !== "SOLD" && watch.isReduced}
              onHold={watch.status === "HOLD"}
            />
            <p className="watch-detail__brand">{watch.brand}</p>
            <h1 className="watch-detail__title">{watch.name}</h1>
            {watch.status === "SOLD" ? (
              <p className="watch-detail__sold">Sold</p>
            ) : (
              <PiecePrice
                className="watch-detail__price"
                price={formatPrice(watch.priceCents)}
                priceSet={watch.priceCents != null}
                compareAt={watch.compareAt}
              />
            )}

            {watch.status === "AVAILABLE" ? (
              <BuyButtons
                gate={{ kind: customer.status === "ready" ? "ready" : customer.status }}
                next={`/watches/${watch.id}`}
                buyForm={customer.status === "ready" ? <OrderForm watchId={watch.id} profile={customer.profile} /> : null}
                depositForm={
                  customer.status === "ready" && watch.priceCents != null ? (
                    <DepositForm watchId={watch.id} priceCents={watch.priceCents} settings={settings} profile={customer.profile} />
                  ) : null
                }
                depositLabel={
                  watch.priceCents != null ? formatCents(depositAmount(watch.priceCents, settings.depositPercent)) : null
                }
              />
            ) : watch.status === "HOLD" ? (
              <div className="status-notice">
                <p className="status-notice__title">On hold for another customer</p>
                <p>
                  A deposit has been placed on this piece. If the sale doesn&rsquo;t go ahead it will be available
                  again — save it to keep an eye on it, or <Link href="/sourcing">ask us to find a similar one</Link>.
                </p>
              </div>
            ) : (
              <RequestPiece
                gate={customer.status}
                next={`/watches/${watch.id}`}
                brand={watch.brand}
                model={watch.name}
                pageUrl={`https://zesprit-watch.vercel.app/watches/${watch.id}`}
                profile={customer.status === "ready" ? customer.profile : null}
              />
            )}

            <div className="accordions">
              {watch.descriptionHtml && (
                <details className="accordion" open>
                  <summary>
                    <AccordionIcon kind="doc" />
                    Description
                  </summary>
                  <div className="accordion__body">
                    <div className="watch-detail__description" dangerouslySetInnerHTML={{ __html: watch.descriptionHtml }} />
                    {watch.tags.length > 0 && (
                      <ul className="watch-detail__tags">
                        {watch.tags.map((tag) => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              )}
              <details className="accordion">
                <summary>
                  <AccordionIcon kind="promise" />
                  Quality &amp; Authenticity Promise
                </summary>
                <div className="accordion__body">
                  <ul className="accordion__list">
                    {QUALITY_PROMISE.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </details>
              <details className="accordion">
                <summary>
                  <AccordionIcon kind="message" />
                  Message
                </summary>
                <div className="accordion__body">
                  {customer.status === "ready" ? (
                    <PieceMessageForm watchId={watch.id} email={customer.profile.email} />
                  ) : (
                    <p className="accordion-note">
                      Questions about this piece?{" "}
                      <Link href={`/account/${customer.status === "signed-out" ? "login" : "complete"}?next=${encodeURIComponent(`/watches/${watch.id}`)}`}>
                        {customer.status === "signed-out" ? "Sign in" : "Complete your details"}
                      </Link>{" "}
                      to message us.
                    </p>
                  )}
                </div>
              </details>
              <details className="accordion">
                <summary>
                  <AccordionIcon kind="shipping" />
                  Shipping
                </summary>
                <div className="accordion__body">
                  <ul className="accordion__list">
                    {SHIPPING_INFO.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </details>
            </div>

            <div className="watch-detail__actions">
              <ShareButton title={watch.name} />
              <SaveButton watchId={watch.id} />
            </div>
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
          <Link href="/journal">Journal</Link> · Care Guide · <Link href="/contact">Contact</Link> · <Link href="/privacy">Privacy</Link>
        </p>
      </footer>
    </>
  );
}

function AccordionIcon({ kind }: { kind: "doc" | "promise" | "message" | "shipping" }) {
  const paths: Record<typeof kind, React.ReactNode> = {
    doc: <path d="M4 1.75h5.5L12.25 4.5v9.75H4zM9.5 1.75V4.5h2.75M6 7.5h4.25M6 10h4.25" />,
    promise: (
      <>
        <rect x="3.25" y="2.5" width="9.5" height="11.75" rx="1.25" />
        <path d="M6 1.75h4v1.75H6zM5.75 7h4.5M5.75 9.5h4.5M5.75 12h2.5" />
      </>
    ),
    message: (
      <>
        <path d="M8 13.75a5.75 5.75 0 1 0-5.1-3.1l-.9 3.1 3.1-.9a5.7 5.7 0 0 0 2.9.9Z" />
        <path d="M5.5 8h.01M8 8h.01M10.5 8h.01" strokeWidth="1.8" />
      </>
    ),
    shipping: (
      <>
        <path d="M1.75 4h7.5v6.75h-7.5zM9.25 6.5h2.6l2.4 2.4v1.85h-5" />
        <circle cx="4.25" cy="11.5" r="1.25" />
        <circle cx="11.5" cy="11.5" r="1.25" />
      </>
    ),
  };
  return (
    <svg className="accordion__icon" viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[kind]}
    </svg>
  );
}
