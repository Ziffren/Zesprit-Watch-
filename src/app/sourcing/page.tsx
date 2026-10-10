import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { AccountGate } from "@/components/account-gate";
import { getCustomer } from "@/lib/customer";
import { getAllBrandNames } from "@/lib/storefront";
import { SourcingForm } from "./sourcing-form";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Watch Sourcing — Z’esprit Watch",
  description: "Looking for a specific vintage watch? Tell us the model, budget and condition — we’ll search for it.",
};

export const dynamic = "force-dynamic";

const STEPS = [
  { title: "Tell us the watch", body: "Brand, model or reference, your budget, the condition you want and whether you need the full set." },
  { title: "We search", body: "We look through the Japanese vintage market for pieces that match what you asked for." },
  { title: "You decide", body: "We send you what we find, with photos and condition notes. Nothing is bought until you say yes." },
];

export default async function SourcingPage() {
  const [customer, brands] = await Promise.all([getCustomer(), getAllBrandNames()]);

  return (
    <>
      <SiteHeader active="sourcing" />
      <main className="sourcing-page">
        <section className="sourcing-intro">
          <h1 className="sourcing-intro__title">Watch Sourcing</h1>
          <p className="sourcing-intro__lede">
            Can&rsquo;t find the piece you want in the collection? Tell us exactly what you&rsquo;re after and
            we&rsquo;ll go looking for it.
          </p>
          <ol className="sourcing-steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="sourcing-steps__num" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <p className="sourcing-steps__title">{s.title}</p>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="sourcing-form-wrap" aria-label="Sourcing request">
          {customer.status === "ready" ? (
            <SourcingForm profile={customer.profile} brands={brands} />
          ) : (
            <div className="sourcing-card">
              <AccountGate customer={customer} next="/sourcing" action="send a sourcing request" />
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
