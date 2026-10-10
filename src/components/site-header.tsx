import Link from "next/link";
import { getBrandMenu } from "@/lib/storefront";
import { WatchesMenu } from "./watches-menu";
import { AccountLink } from "./account-link";
import { MessageMe } from "./message-me";
import { SOCIAL_LINKS } from "@/lib/site-links";

type Section = "home" | "watches" | "shop" | "sourcing" | null;

// Storefront header (centred lockup): Home · Watches ▾ · Shop · Social ·
// About on the left, wordmark centred, social/cart/CTA on the right.
// "Watches" opens the brand menu; on phones everything folds into "Menu".
export async function SiteHeader({ active = null }: { active?: Section }) {
  const brands = await getBrandMenu();
  const current = (s: Section) => (s === active ? { className: "is-active", "aria-current": "page" as const } : {});

  return (
    <header className="nav-centered">
      <div className="nav-centered__row">
        <div className="nav-centered__menu">
          <nav className="nav-centered__links nav-centered__links--desktop" aria-label="Primary">
            <Link href="/" {...current("home")}>
              Home
            </Link>
            <WatchesMenu brands={brands} active={active === "watches"} />
            <Link href="/collections/all" {...current("shop")}>
              Shop
            </Link>
            <Link href="/sourcing" {...current("sourcing")}>
              Watch Sourcing
            </Link>
            <Link href="/#footer">Social</Link>
            <Link href="/#heritage">About</Link>
          </nav>
          <details className="nav-centered__disclosure">
            <summary className="nav-centered__menu-toggle">Menu</summary>
            <nav className="nav-centered__links nav-centered__links--mobile" aria-label="Primary">
              <Link href="/">Home</Link>
              <details className="nav-mobile-brands">
                <summary>Watches</summary>
                <ul>
                  {brands.map((b) => (
                    <li key={b.slug}>
                      <Link href={`/collections/${b.slug}`}>
                        {b.name} <span className="watches-menu__count">{b.count}</span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/collections/all">All watches →</Link>
                  </li>
                </ul>
              </details>
              <Link href="/collections/all">Shop</Link>
              <Link href="/sourcing">Watch Sourcing</Link>
              <Link href="/#footer">Social</Link>
              <Link href="/#heritage">About</Link>
            </nav>
          </details>
        </div>

        <Link className="nav-centered__brand" href="/" aria-label="Z’esprit Watch — home">
          <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path d="M7 23a13 13 0 0 1 26 0" stroke="var(--color-ink)" strokeWidth="1.5" />
            <line x1="6" y1="23" x2="34" y2="23" stroke="var(--color-ink)" strokeWidth="1.5" />
            <line x1="20" y1="23" x2="20" y2="12" stroke="var(--color-accent-2)" strokeWidth="1.5" />
            <circle cx="20" cy="23" r="2" fill="var(--color-ink)" />
          </svg>
          <span className="nav-centered__wordmark">Z&rsquo;esprit Watch</span>
        </Link>

        <div className="nav-centered__actions">
          <a
            className="icon-link icon-link--social"
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Z’esprit Watch on Instagram (opens in a new tab)"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="17.3" cy="6.7" r="1" fill="currentColor" />
            </svg>
          </a>
          <a
            className="icon-link icon-link--social"
            href={SOCIAL_LINKS.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Z’esprit Watch on Facebook (opens in a new tab)"
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
          <AccountLink />
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
          <MessageMe />
        </div>
      </div>
    </header>
  );
}
