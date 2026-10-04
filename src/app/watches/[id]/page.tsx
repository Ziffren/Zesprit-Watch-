import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getWatchDetail } from "@/lib/storefront";
import { OrderForm } from "./order-form";

export default async function WatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const watch = await getWatchDetail(id);

  if (!watch) notFound();

  const cover = watch.photoUrls[0] ?? null;

  return (
    <>
      <header className="detail-header">
        <Link className="detail-header__back" href="/">
          ← Z&rsquo;esprit Watch
        </Link>
      </header>

      <main>
        <section className="watch-detail">
          <div className="watch-detail__media">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={watch.name} />
            ) : (
              <div
                className="watch-icon watch-icon--large"
                style={
                  {
                    "--hour-deg": `${watch.hour}deg`,
                    "--min-deg": `${watch.min}deg`,
                  } as CSSProperties
                }
                aria-hidden="true"
              >
                <span className="watch-icon__hand watch-icon__hand--hour" />
                <span className="watch-icon__hand watch-icon__hand--min" />
                <span className="watch-icon__hub" />
              </div>
            )}
          </div>

          <div className="watch-detail__info">
            <p className="watch-detail__brand">{watch.brand}</p>
            <h1 className="watch-detail__title">{watch.name}</h1>
            <p className="watch-detail__price">Price on request</p>

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
          </div>
        </section>
      </main>

      <footer className="foot-mast">
        <p className="wordmark">Z&rsquo;esprit Watch</p>
        <p className="tagline muted">Vintage watches, restored to keep time again.</p>
        <p className="links muted">Journal · Care Guide · Contact</p>
      </footer>
    </>
  );
}
