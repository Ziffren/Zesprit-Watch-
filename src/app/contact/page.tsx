import Link from "next/link";
import { ContactForm } from "./contact-form";
import { AccountGate } from "@/components/account-gate";
import { getCustomer } from "@/lib/customer";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const customer = await getCustomer();
  return (
    <>
      <header className="detail-header">
        <Link className="detail-header__back" href="/">
          ← Z&rsquo;esprit Watch
        </Link>
      </header>

      <main>
        <div className="auth-page">
          {customer.status === "ready" ? (
            <ContactForm profile={customer.profile} />
          ) : (
            <div className="auth-card">
              <h1 className="order-form__title">Get in touch</h1>
              <AccountGate customer={customer} next="/contact" action="send us a message" />
            </div>
          )}
        </div>
      </main>

      <footer className="foot-mast">
        <p className="wordmark">Z&rsquo;esprit Watch</p>
        <p className="tagline muted">Vintage watches, restored to keep time again.</p>
        <p className="links muted">
          <Link href="/journal">Journal</Link> · Care Guide ·{" "}
          <Link href="/contact">Contact</Link> · <Link href="/privacy">Privacy</Link>
        </p>
      </footer>
    </>
  );
}
