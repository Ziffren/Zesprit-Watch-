import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AccountGate } from "@/components/account-gate";
import { getCustomer } from "@/lib/customer";
import { createClient } from "@/lib/supabase/server";
import { formatCents, formatPrice } from "@/lib/admin/types";
import { CheckoutForm } from "./checkout-form";
import { RemoveButton } from "./remove-button";

export const metadata: Metadata = { title: "Cart — Z’esprit Watch" };
export const dynamic = "force-dynamic";

type Line = {
  watchId: string;
  product: { id: string; productName: string; brand: string; status: string; priceCents: number | null; photoUrls: string[] } | null;
};

export default async function CartPage() {
  const customer = await getCustomer();
  let lines: Line[] = [];
  if (customer.status !== "signed-out") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cart_items")
      .select("watchId, product:products(id, productName, brand, status, priceCents, photoUrls)")
      .eq("userId", customer.profile.userId)
      .order("createdAt", { ascending: true });
    lines = (data ?? []) as unknown as Line[];
  }
  const available = lines.filter((l) => l.product?.status === "AVAILABLE");
  const priced = available.filter((l) => l.product?.priceCents != null);
  const subtotal = priced.reduce((s, l) => s + (l.product!.priceCents ?? 0), 0);
  const onRequest = available.length - priced.length;

  return (
    <>
      <SiteHeader />
      <main className="store-page">
        <h1 className="store-page__title">Your cart</h1>
        {customer.status === "signed-out" ? (
          <div className="store-gate">
            <AccountGate customer={customer} next="/cart" action="use your cart" />
          </div>
        ) : lines.length === 0 ? (
          <div className="store-empty">
            <p>Your cart is empty.</p>
            <Link className="buy-btn buy-btn--primary" href="/collections/all">
              Browse watches
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <ul className="line-list">
              {lines.map((l) => {
                const p = l.product;
                const unavailable = p?.status !== "AVAILABLE";
                return (
                  <li className="line" key={l.watchId} data-unavailable={unavailable || undefined}>
                    <Link className="line__media" href={`/watches/${l.watchId}`}>
                      {p?.photoUrls?.[0] ? (
                        <Image src={p.photoUrls[0]} alt="" fill quality={85} sizes="7rem" />
                      ) : (
                        <span className="line__noimg" aria-hidden="true" />
                      )}
                    </Link>
                    <div className="line__info">
                      <span className="line__brand">{p?.brand}</span>
                      <Link className="line__name" href={`/watches/${l.watchId}`}>
                        {p?.productName ?? "Watch no longer listed"}
                      </Link>
                      {unavailable && (
                        <span className="line__flag">{p?.status === "HOLD" ? "On hold for another customer" : "No longer available"}</span>
                      )}
                    </div>
                    <div className="line__end">
                      <span className="line__price">{unavailable ? "—" : formatPrice(p?.priceCents ?? null)}</span>
                      <RemoveButton table="cart_items" watchId={l.watchId} label="Remove" />
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="cart-side">
              <div className="cart-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatCents(subtotal)}</strong>
                </div>
                {onRequest > 0 && (
                  <p className="buy-note">
                    + {onRequest} piece{onRequest > 1 ? "s" : ""} priced on request — we&rsquo;ll confirm the total with you.
                  </p>
                )}
                <p className="buy-note">Shipping is arranged with you after the request.</p>
              </div>
              {customer.status === "ready" ? (
                <CheckoutForm profile={customer.profile} count={available.length} />
              ) : (
                <div className="store-gate">
                  <AccountGate customer={customer} next="/cart" action="send your purchase request" />
                </div>
              )}
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
