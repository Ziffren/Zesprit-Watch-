import Link from "next/link";
import { SOCIAL_LINKS } from "@/lib/site-links";

// Shared storefront footer (was copy-pasted on every page). id="footer" is
// the target of the header's "Social" link.
export function SiteFooter() {
  return (
    <footer className="foot-mast" id="footer">
      <p className="wordmark">Z&rsquo;esprit Watch</p>
      <p className="tagline muted">Vintage watches, restored to keep time again.</p>
      <p className="links muted">
        <Link href="/journal">Journal</Link> · Care Guide · <Link href="/contact">Contact</Link> ·{" "}
        <Link href="/privacy">Privacy</Link>
      </p>
      <p className="foot-social">
        <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Z’esprit Watch on Instagram (opens in a new tab)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="17.3" cy="6.7" r="1" fill="currentColor" />
          </svg>
          Instagram
        </a>
        <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Z’esprit Watch on Facebook (opens in a new tab)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
            <path
              d="M14.5 8.2h2.2V5h-2.4C11.9 5 10.4 6.6 10.4 9v2H8v3.2h2.4V21h3.2v-6.8h2.4l.4-3.2h-2.8V9c0-.5.2-.8.9-.8Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
          Facebook
        </a>
      </p>
    </footer>
  );
}
