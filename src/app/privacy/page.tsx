import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Privacy Policy — Z’esprit Watch",
  description: "What Z’esprit Watch collects, why, who processes it, and how to delete your data.",
};

const UPDATED = "10 October 2026";

// Plain-language policy describing what this site actually does (see
// src/app/api/track, src/app/account, Supabase/Vercel/Resend). Also linked
// from Google's and Facebook's sign-in consent screens.
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <article className="legal-page__body rich-text-content">
          <p className="legal-page__updated">Last updated {UPDATED}</p>
          <h1>Privacy Policy</h1>
          <p>
            Z&rsquo;esprit Watch (&ldquo;we&rdquo;) sells vintage watches through this website. This page explains
            what personal information we collect, why, who helps us process it, and how you can see or delete it.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Your account.</strong> When you create an account we store your name, email address, phone
              number and address, and a securely hashed password (we never see your password).
            </li>
            <li>
              <strong>Google or Facebook sign-in.</strong> If you choose &ldquo;Continue with Google&rdquo; or
              &ldquo;Continue with Facebook&rdquo;, we receive only your name, email address and profile picture
              link from that service. We don&rsquo;t receive your contacts, posts or password, and we never post on
              your behalf. We then ask you for a phone number and address to complete your account.
            </li>
            <li>
              <strong>Requests and messages.</strong> When you request a piece or send us a message, we store it
              with your account details so we can reply.
            </li>
            <li>
              <strong>Saved pieces.</strong> Watches you save to your wishlist.
            </li>
            <li>
              <strong>Site statistics.</strong> Pages viewed, the approximate location (country, region and city,
              derived by our hosting provider), device type (desktop, mobile or tablet) and the referring site. We
              do <em>not</em> store your IP address or browser fingerprint, and statistics are only linked to an
              account if you are signed in.
            </li>
            <li>
              <strong>Cookies and local storage.</strong> We use only the cookies needed to keep you signed in,
              plus a random visit identifier kept in your browser&rsquo;s local storage for statistics. No
              advertising or third-party tracking cookies.
            </li>
          </ul>

          <h2>Why we use it</h2>
          <ul>
            <li>To run your account and keep it secure, including confirming your email address.</li>
            <li>To respond to your requests and messages and arrange a sale.</li>
            <li>To understand which pieces and pages people visit so we can improve the site.</li>
          </ul>
          <p>We do not sell your information or use it for advertising.</p>

          <h2>Who processes it for us</h2>
          <ul>
            <li>
              <strong>Supabase</strong> — database, sign-in and photo storage.
            </li>
            <li>
              <strong>Vercel</strong> — website hosting.
            </li>
            <li>
              <strong>Resend</strong> — sending account and notification emails.
            </li>
            <li>
              <strong>Google</strong> and <strong>Meta (Facebook)</strong> — only if you choose to sign in with
              them.
            </li>
          </ul>
          <p>These providers may store data outside your country; each is bound by its own data-protection terms.</p>

          <h2>How long we keep it</h2>
          <p>
            Account information is kept while your account is open. Records of requests may be kept as long as
            needed for the sale, our accounts and the law. Statistics are kept in aggregate.
          </p>

          <h2 id="delete-data">Your choices and deleting your data</h2>
          <ul>
            <li>
              You can view and update your details at any time on your <Link href="/account">account page</Link>.
            </li>
            <li>
              To have your account and personal data deleted, send us a message from the{" "}
              <Link href="/contact">Contact page</Link> while signed in, or reply to any email we have sent you,
              asking for deletion. We will delete your account and associated data within 30 days and confirm
              when it&rsquo;s done.
            </li>
            <li>
              If you signed in with Facebook, you can also remove Z&rsquo;esprit Watch under Facebook &rarr;
              Settings &amp; privacy &rarr; Apps and websites; then ask us to delete your data as above.
            </li>
          </ul>

          <h2>Changes</h2>
          <p>If we change this policy we&rsquo;ll update the date at the top of this page.</p>
        </article>
      </main>
      <footer className="foot-mast">
        <p className="wordmark">Z&rsquo;esprit Watch</p>
        <p className="tagline muted">Vintage watches, restored to keep time again.</p>
        <p className="links muted">
          <Link href="/journal">Journal</Link> · Care Guide · <Link href="/contact">Contact</Link> ·{" "}
          <Link href="/privacy">Privacy</Link>
        </p>
      </footer>
    </>
  );
}
