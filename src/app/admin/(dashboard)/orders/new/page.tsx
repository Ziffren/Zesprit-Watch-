import { listProducts } from "@/lib/admin/queries";
import { createOrder } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const products = await listProducts();
  const available = products.filter((p) => p.status === "AVAILABLE");

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Log order manually</p>
      </header>

      <div className="admin-content">
        <p className="admin-hint" style={{ marginBottom: "var(--space-md)" }}>
          For sales agreed outside the website (phone, in person). Defaults to
          &ldquo;Confirmed&rdquo; since the deal is already made — change it if that&rsquo;s not
          the case.
        </p>

        <form className="admin-form" action={createOrder}>
          <div className="admin-form__main">
            <div className="admin-panel">
              <label className="admin-field">
                <span>Watch</span>
                <select name="watchId" required defaultValue="">
                  <option value="" disabled>
                    Select a watch…
                  </option>
                  {available.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productName} — {p.brand}
                    </option>
                  ))}
                </select>
              </label>
              {available.length === 0 && (
                <p className="admin-hint">No available watches to pick from.</p>
              )}
            </div>

            <div className="admin-panel">
              <h2>Customer</h2>
              <label className="admin-field">
                <span>Name</span>
                <input name="customerName" required />
              </label>
              <label className="admin-field">
                <span>Email</span>
                <input type="email" name="customerEmail" required />
              </label>
              <label className="admin-field">
                <span>Phone (optional)</span>
                <input type="tel" name="customerPhone" />
              </label>
              <label className="admin-field">
                <span>Message / notes (optional)</span>
                <textarea name="message" rows={3} />
              </label>
            </div>
          </div>

          <div className="admin-form__side">
            <div className="admin-panel">
              <h2>Order</h2>
              <label className="admin-field">
                <span>Status</span>
                <select name="status" defaultValue="CONFIRMED">
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="FULFILLED">Fulfilled</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Agreed price (USD, optional)</span>
                <input type="number" name="agreedPrice" step="0.01" min="0" />
              </label>
            </div>

            <div className="admin-form__actions">
              <button className="admin-btn admin-btn--primary" type="submit">
                Save order
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
