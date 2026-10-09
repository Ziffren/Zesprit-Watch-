import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomer } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">{customer.name ?? customer.email}</p>
      </header>

      <div className="admin-content">
        <div className="admin-form">
          <div className="admin-form__main">
            <div className="admin-panel">
              <h2>Saved pieces</h2>
              {customer.saved_watches.length === 0 ? (
                <p className="admin-hint">Nothing saved.</p>
              ) : (
                <ul className="admin-chip-select" style={{ maxHeight: "none" }}>
                  {customer.saved_watches.map(
                    (s) =>
                      s.watches && (
                        <li key={s.watches.id} style={{ padding: "var(--space-2xs) var(--space-xs)" }}>
                          <Link className="admin-row-link" href={`/admin/products/${s.watches.id}`}>
                            {s.watches.productName} — {s.watches.brand}
                          </Link>
                        </li>
                      )
                  )}
                </ul>
              )}
            </div>

            <div className="admin-panel">
              <h2>Orders</h2>
              {customer.orders.length === 0 ? (
                <p className="admin-hint">No orders yet.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Watch</th>
                        <th>Status</th>
                        <th>Placed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.orders.map((o) => (
                        <tr key={o.id}>
                          <td>
                            <Link className="admin-row-link" href={`/admin/orders/${o.id}`}>
                              {o.watches?.productName ?? "—"}
                            </Link>
                          </td>
                          <td>
                            <span
                              className="admin-badge"
                              data-tone={o.status === "PENDING" ? "draft" : "active"}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="admin-form__side">
            <div className="admin-panel">
              <h2>Profile</h2>
              <p>
                <strong>{customer.name ?? "No name on file"}</strong>
              </p>
              <p className="admin-hint">{customer.email}</p>
              {customer.phone && <p className="admin-hint">{customer.phone}</p>}
              {customer.address && (
                <p className="admin-hint" style={{ whiteSpace: "pre-line" }}>
                  {customer.address}
                </p>
              )}
              <p className="admin-hint">
                Joined {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
