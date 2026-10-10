import Link from "next/link";
import { MessageForm } from "@/components/message-form";
import { getCustomer } from "@/lib/customer";
import { SiteFooter } from "@/components/site-footer";

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
          <div className="auth-card">
            <MessageForm
              title="Get in touch"
              profile={
                customer.status === "signed-out"
                  ? null
                  : { name: customer.profile.name, email: customer.profile.email, phone: customer.profile.phone }
              }
            />
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
