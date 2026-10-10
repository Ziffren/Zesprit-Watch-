import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AccountGate } from "@/components/account-gate";
import { getCustomer } from "@/lib/customer";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/admin/types";
import { RemoveButton } from "../cart/remove-button";

export const metadata: Metadata = { title: "Wishlist — Z’esprit Watch" };
export const dynamic = "force-dynamic";

type Saved = {
  watchId: string;
  product: { id: string; productName: string; brand: string; status: string; priceCents: number | null; photoUrls: string[] } | null;
};

export default async function WishlistPage() {
  const customer = await getCustomer();
  let saved: Saved[] = [];
  if (customer.status !== "signed-out") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("saved_watches")
      .select("watchId, product:products(id, productName, brand, status, priceCents, photoUrls)")
      .eq("userId", customer.profile.userId)
      .order("createdAt", { ascending: false });
    saved = (data ?? []) as unknown as Saved[];
  }

  return (
    <>
      <SiteHeader />
      <main className="store-page">
        <h1 className="store-page__title">Wishlist</h1>
        {customer.status === "signed-out" ? (
          <div className="store-gate">
            <AccountGate customer={customer} next="/wishlist" action="see your wishlist" />
          </div>
        ) : saved.length === 0 ? (
          <div className="store-empty">
            <p>No saved pieces yet — tap the heart on any watch to keep it here.</p>
            <Link className="buy-btn buy-btn--primary" href="/collections/all">
              Browse watches
            </Link>
          </div>
        ) : (
          <ul className="wish-grid">
            {saved.map((s) => {
              const p = s.product;
              const label = p?.status === "SOLD" ? "Sold" : p?.status === "HOLD" ? "On hold" : formatPrice(p?.priceCents ?? null);
              return (
                <li className="wish-card" key={s.watchId}>
                  <Link className="wish-card__media" href={`/watches/${s.watchId}`}>
                    {p?.photoUrls?.[0] ? (
                      <Image src={p.photoUrls[0]} alt={p.productName} fill quality={85} sizes="(max-width: 960px) 50vw, 25vw" />
                    ) : (
                      <span className="line__noimg" aria-hidden="true" />
                    )}
                  </Link>
                  <span className="line__brand">{p?.brand}</span>
                  <Link className="wish-card__name" href={`/watches/${s.watchId}`}>
                    {p?.productName ?? "Watch no longer listed"}
                  </Link>
                  <span className="wish-card__price" data-muted={p?.status !== "AVAILABLE" || undefined}>
                    {label}
                  </span>
                  <RemoveButton table="saved_watches" watchId={s.watchId} label="Remove" />
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
