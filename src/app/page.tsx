import type { CSSProperties } from "react";
import Link from "next/link";
import { getShopRow } from "@/lib/storefront";
import { SiteHeader } from "@/components/site-header";
import { ShopRow } from "@/components/shop-row";
import { ShopRowCard } from "@/components/product-card";
import { HeroBanner, Showcase } from "@/components/site-showcase";
import { getSiteImages } from "@/lib/site-images";

// "New" / "Reduced" badges are date-based, so refresh at least hourly even
// when no product is saved (saving revalidates immediately).
export const revalidate = 3600;

export default async function Home() {
  const [{ pieces, total }, siteImages] = await Promise.all([getShopRow(), getSiteImages()]);

  return (
    <>
      <SiteHeader active="home" />

      <main id="top">
        {siteImages[1].imageUrl ? (
          <HeroBanner image={siteImages[1]} />
        ) : (
          <section className="hero-marquee reveal" style={{ "--i": 0 } as CSSProperties}>
            <h1 className="display-xl">Time, worn well.</h1>
          </section>
        )}

        <section className="shop-section" id="collection" aria-labelledby="shop-title">
          <h2 className="visually-hidden" id="shop-title">
            In the collection — {total} watches, highest price first
          </h2>
          <ShopRow label="Watches in stock, highest price first" viewAllHref="/collections/all">
            {pieces.map((p) => (
              <li className="shop-row__item" key={p.id}>
                <ShopRowCard piece={p} />
              </li>
            ))}
          </ShopRow>
        </section>

        <Showcase images={{ 2: siteImages[2], 3: siteImages[3], 4: siteImages[4], 5: siteImages[5] }} />

        <section className="heritage" id="heritage">
          <div className="heritage__copy">
            <h2>Restored, not reinvented.</h2>
            <p>
              We take watches that have already lived a life — cased, wound,
              carried through decades — and bring the movement back to time.
              Nothing is redialed to look new. The patina stays; the
              mechanism doesn&rsquo;t skip a beat.
            </p>
            <p>
              A watchmaker opens every piece before it&rsquo;s listed. What
              we can&rsquo;t bring back to spec, we don&rsquo;t sell.
            </p>
          </div>
          <div className="heritage__figure" aria-hidden="true">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="70" stroke="var(--color-ink)" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="46" stroke="var(--color-ink-2)" strokeWidth="1" />
              <circle cx="72" cy="82" r="18" stroke="var(--color-accent-2)" strokeWidth="1.5" />
              <circle cx="128" cy="118" r="14" stroke="var(--color-accent-2)" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="3" fill="var(--color-ink)" />
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const x1 = 100 + Math.sin(angle) * 74;
                const y1 = 100 - Math.cos(angle) * 74;
                const x2 = 100 + Math.sin(angle) * 66;
                const y2 = 100 - Math.cos(angle) * 66;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="var(--color-ink-2)"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
          </div>
        </section>

        <section className="proof-room">
          <blockquote className="proof-room__quote">
            &ldquo;Every watch we restore has already told one story. We
            make sure it can tell another.&rdquo;
          </blockquote>
          <p className="proof-room__attribution">
            <span className="caps">Z&rsquo;esprit Watch</span>
          </p>
        </section>

        <section className="trust-strip" aria-label="Service assurances">
          <div>Hand-inspected before sale</div>
          <div>Certified authentic</div>
          <div>Insured worldwide shipping</div>
          <div>12-month mechanical guarantee</div>
        </section>

        <section className="cta-final">
          <Link className="link" href="/collections/all">
            View the full collection →
          </Link>
        </section>
      </main>

      <footer className="foot-mast" id="footer">
        <p className="wordmark">Z&rsquo;esprit Watch</p>
        <p className="tagline muted">
          Vintage watches, restored to keep time again.
        </p>
        <p className="links muted">
          <Link href="/journal">Journal</Link> · Care Guide · <Link href="/contact">Contact</Link>
        </p>
      </footer>
    </>
  );
}
