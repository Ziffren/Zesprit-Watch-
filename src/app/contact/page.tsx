import Link from "next/link";
import { ContactForm } from "./contact-form";

export default function ContactPage() {
  return (
    <>
      <header className="detail-header">
        <Link className="detail-header__back" href="/">
          ← Z&rsquo;esprit Watch
        </Link>
      </header>

      <main>
        <div className="auth-page">
          <ContactForm />
        </div>
      </main>

      <footer className="foot-mast">
        <p className="wordmark">Z&rsquo;esprit Watch</p>
        <p className="tagline muted">Vintage watches, restored to keep time again.</p>
        <p className="links muted">
          <Link href="/journal">Journal</Link> · Care Guide ·{" "}
          <Link href="/contact">Contact</Link>
        </p>
      </footer>
    </>
  );
}
