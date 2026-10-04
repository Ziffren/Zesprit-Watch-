import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrder } from "@/lib/admin/queries";
import { updateOrder } from "../actions";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"] as const;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">{order.customerName}</p>
      </header>

      <div className="admin-content">
        <form className="admin-form" action={updateOrder}>
          <input type="hidden" name="id" value={order.id} />

          <div className="admin-form__main">
            <div className="admin-panel">
              <h2>Customer</h2>
              <p>
                <strong>{order.customerName}</strong>
              </p>
              <p className="admin-hint">{order.customerEmail}</p>
              {order.customerPhone && <p className="admin-hint">{order.customerPhone}</p>}
            </div>

            <div className="admin-panel">
              <h2>Watch</h2>
              {order.watches ? (
                <Link className="admin-row-link" href={`/admin/products/${order.watches.id}`}>
                  {order.watches.productName} — {order.watches.brand}
                </Link>
              ) : (
                <p className="admin-hint">Watch no longer exists.</p>
              )}
            </div>

            {order.message && (
              <div className="admin-panel">
                <h2>Message</h2>
                <p>{order.message}</p>
              </div>
            )}
          </div>

          <div className="admin-form__side">
            <div className="admin-panel">
              <h2>Order</h2>
              <p className="admin-hint">
                Source: {order.source} · Placed {new Date(order.createdAt).toLocaleString()}
              </p>

              <label className="admin-field">
                <span>Status</span>
                <select name="status" defaultValue={order.status}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s[0] + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-field">
                <span>Agreed price (USD)</span>
                <input
                  type="number"
                  name="agreedPrice"
                  step="0.01"
                  min="0"
                  defaultValue={
                    order.agreedPriceCents != null ? (order.agreedPriceCents / 100).toFixed(2) : ""
                  }
                />
              </label>
            </div>

            <div className="admin-form__actions">
              <button className="admin-btn admin-btn--primary" type="submit">
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
