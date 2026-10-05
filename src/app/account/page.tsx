import Link from "next/link";
import { getCustomerAccount } from "@/lib/account";
import { signOutCustomer } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const account = await getCustomerAccount();
  if (!account) return null; // proxy.ts already redirects; this satisfies TS

  return (
    <div className="account-page">
      <header className="account-page__header">
        <div>
          <p className="watch-detail__brand">Account</p>
          <h1 className="watch-detail__title">{account.name ?? account.email}</h1>
          <p className="account-page__muted">{account.email}</p>
        </div>
        <form action={signOutCustomer}>
          <button className="account-page__signout" type="submit">
            Sign out
          </button>
        </form>
      </header>

      <section className="account-page__section">
        <h2>Saved pieces</h2>
        {account.saved.length === 0 ? (
          <p className="account-page__muted">
            Nothing saved yet — tap the heart on any watch&rsquo;s page to keep track of it here.
          </p>
        ) : (
          <div className="product-grid">
            {account.saved.map(
              (s) =>
                s.watches && (
                  <article className="product" key={s.watches.id}>
                    <div className="product__media">
                      {s.watches.photoUrls[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.watches.photoUrls[0]} alt={s.watches.productName} />
                      ) : (
                        <div className="watch-icon" aria-hidden="true">
                          <span className="watch-icon__hand watch-icon__hand--hour" />
                          <span className="watch-icon__hand watch-icon__hand--min" />
                          <span className="watch-icon__hub" />
                        </div>
                      )}
                    </div>
                    <div className="product__meta">
                      <h3 className="product__name">{s.watches.productName}</h3>
                      <p className="product__detail">{s.watches.brand}</p>
                      {s.watches.status === "SOLD" && (
                        <p className="product__detail">No longer available</p>
                      )}
                    </div>
                    <Link className="product__view" href={`/watches/${s.watches.id}`}>
                      View piece →
                    </Link>
                  </article>
                )
            )}
          </div>
        )}
      </section>

      <section className="account-page__section">
        <h2>Your requests</h2>
        {account.orders.length === 0 ? (
          <p className="account-page__muted">No requests yet.</p>
        ) : (
          <ul className="account-page__orders">
            {account.orders.map((o) => (
              <li key={o.id}>
                <Link href={o.watches ? `/watches/${o.watches.id}` : "#"}>
                  {o.watches?.productName ?? "Watch"}
                </Link>
                <span className="account-page__order-status">{o.status}</span>
                <span className="account-page__muted">
                  {new Date(o.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
