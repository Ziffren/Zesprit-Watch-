import type { CSSProperties } from "react";
import Link from "next/link";
import { getFeaturedPieces } from "@/lib/storefront";

export default async function Home() {
  const pieces = await getFeaturedPieces();

  return (
    <>
      <header className="nav-centered">
        <div className="nav-centered__row">
          <div className="nav-centered__menu">
            <nav className="nav-centered__links nav-centered__links--desktop" aria-label="Primary">
              <a href="#top">Home</a>
              <a href="#collection">Watches</a>
              <a href="#collection" className="is-active" aria-current="page">
                Shop
              </a>
              <a href="#footer">Social</a>
              <a href="#heritage">About</a>
            </nav>
            <details className="nav-centered__disclosure">
              <summary className="nav-centered__menu-toggle">Menu</summary>
              <nav className="nav-centered__links nav-centered__links--mobile" aria-label="Primary">
                <a href="#top">Home</a>
                <a href="#collection">Watches</a>
                <a href="#collection" className="is-active" aria-current="page">
                  Shop
                </a>
                <a href="#footer">Social</a>
                <a href="#heritage">About</a>
              </nav>
            </details>
          </div>

          <a className="nav-centered__brand" href="#top" aria-label="Z’esprit Watch — home">
            <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path
                d="M7 23a13 13 0 0 1 26 0"
                stroke="var(--color-ink)"
                strokeWidth="1.5"
              />
              <line
                x1="6"
                y1="23"
                x2="34"
                y2="23"
                stroke="var(--color-ink)"
                strokeWidth="1.5"
              />
              <line
                x1="20"
                y1="23"
                x2="20"
                y2="12"
                stroke="var(--color-accent-2)"
                strokeWidth="1.5"
              />
              <circle cx="20" cy="23" r="2" fill="var(--color-ink)" />
            </svg>
            <span className="nav-centered__wordmark">Z&rsquo;esprit Watch</span>
          </a>

          <div className="nav-centered__actions">
            <a
              className="icon-link icon-link--social"
              href="#"
              aria-label="Z’esprit Watch on Instagram"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17.3" cy="6.7" r="1" fill="currentColor" />
              </svg>
            </a>
            <a
              className="icon-link icon-link--social"
              href="#"
              aria-label="Z’esprit Watch on Facebook"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M14.5 8.2h2.2V5h-2.4C11.9 5 10.4 6.6 10.4 9v2H8v3.2h2.4V21h3.2v-6.8h2.4l.4-3.2h-2.8V9c0-.5.2-.8.9-.8Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a className="icon-link cart-link" href="#" aria-label="View cart, 0 items">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 8h16l-1.4 9.5a2 2 0 0 1-2 1.7H7.4a2 2 0 0 1-2-1.7L4 8Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M8 8V6a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              <span className="cart-count">0</span>
            </a>
            <a className="cta-solid" href="#collection">
              Let&rsquo;s Connect
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero-marquee reveal" style={{ "--i": 0 } as CSSProperties}>
          <h1 className="display-xl">Time, worn well.</h1>
        </section>
        <hr className="rule-thick" />

        <header className="head-hang">
          <h2 className="head-hang__title">Selected pieces</h2>
          <p className="head-hang__lede">
            Each watch is sourced, hand-inspected, and serviced before it
            reaches you — the marks it carries are its own.
          </p>
        </header>

        <section className="product-grid" id="collection" aria-label="Selected pieces">
          {pieces.map((p) => (
            <article className="product" key={p.id}>
              <div className="product__media">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} />
                ) : (
                  <div
                    className="watch-icon"
                    style={
                      {
                        "--hour-deg": `${p.hour}deg`,
                        "--min-deg": `${p.min}deg`,
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
              <div className="product__meta">
                <h3 className="product__name">{p.name}</h3>
                <p className="product__detail">{p.detail}</p>
                <p className="product__price">{p.price}</p>
              </div>
              <Link className="product__view" href={`/watches/${p.id}`}>
                View piece →
              </Link>
            </article>
          ))}
        </section>

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
          <a className="link" href="#collection">
            View the full collection →
          </a>
        </section>
      </main>

      <footer className="foot-mast" id="footer">
        <p className="wordmark">Z&rsquo;esprit Watch</p>
        <p className="tagline muted">
          Vintage watches, restored to keep time again.
        </p>
        <p className="links muted">Journal · Care Guide · Contact</p>
      </footer>
    </>
  );
}
