import Link from "next/link";
import { getOrderCounts, listOrdersPage } from "@/lib/admin/queries";
import { formatCents, type OrderStatus } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"];

function pageHref(q: string, status: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/orders${qs ? `?${qs}` : ""}`;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [{ orders, total }, counts] = await Promise.all([
    listOrdersPage({ page, pageSize: PAGE_SIZE, q, status }),
    getOrderCounts(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Orders</p>
        <Link className="admin-btn admin-btn--primary" href="/admin/orders/new">
          Log order manually
        </Link>
      </header>

      <div className="admin-content">
        <p className="admin-hint" style={{ marginBottom: "var(--space-md)" }}>
          Orders placed on the public site land here automatically. Follow up with the
          customer, then update the status once it&rsquo;s confirmed, fulfilled, or cancelled.
        </p>

        <form className="admin-toolbar" action="/admin/orders" method="get">
          <select name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0] + s.slice(1).toLowerCase()} ({counts[s]})
              </option>
            ))}
          </select>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search customer name or email…"
            aria-label="Search orders"
          />
          <button className="admin-btn" type="submit">
            Filter
          </button>
          {(q || status) && (
            <Link className="admin-btn admin-btn--ghost" href="/admin/orders" prefetch={false}>
              Clear
            </Link>
          )}
        </form>

        {orders.length === 0 ? (
          <p className="admin-empty">No orders match these filters yet.</p>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Watch</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Price</th>
                    <th>Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link className="admin-row-link" href={`/admin/orders/${o.id}`} prefetch={false}>
                          {o.customerName}
                        </Link>
                        <div className="admin-hint">{o.customerEmail}</div>
                      </td>
                      <td>{o.watches?.productName ?? "—"}</td>
                      <td>
                        <span
                          className="admin-badge"
                          data-tone={o.status === "PENDING" ? "draft" : "active"}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td>{o.source}</td>
                      <td>{formatCents(o.agreedPriceCents)}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <nav className="admin-pagination" aria-label="Pagination">
              <span className="admin-hint">
                Showing {rangeStart}–{rangeEnd} of {total}
              </span>
              <div className="admin-pagination__controls">
                {page > 1 ? (
                  <Link className="admin-btn" href={pageHref(q, status ?? "", page - 1)} prefetch={false}>
                    ← Prev
                  </Link>
                ) : (
                  <span className="admin-btn" aria-disabled="true">
                    ← Prev
                  </span>
                )}
                <span className="admin-hint">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link className="admin-btn" href={pageHref(q, status ?? "", page + 1)} prefetch={false}>
                    Next →
                  </Link>
                ) : (
                  <span className="admin-btn" aria-disabled="true">
                    Next →
                  </span>
                )}
              </div>
            </nav>
          </>
        )}
      </div>
    </>
  );
}
