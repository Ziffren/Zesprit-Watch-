import Link from "next/link";
import { listCustomersPage } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function pageHref(q: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/customers${qs ? `?${qs}` : ""}`;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const { customers, total } = await listCustomersPage({ page, pageSize: PAGE_SIZE, q });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Customers</p>
      </header>

      <div className="admin-content">
        <p className="admin-hint" style={{ marginBottom: "var(--space-md)" }}>
          Everyone who has created an account on the public site. Accounts are self-serve —
          there&rsquo;s no &ldquo;create customer&rdquo; here.
        </p>

        <form className="admin-toolbar" action="/admin/customers" method="get">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name or email…"
            aria-label="Search customers"
          />
          <button className="admin-btn" type="submit">
            Search
          </button>
          {q && (
            <Link className="admin-btn admin-btn--ghost" href="/admin/customers" prefetch={false}>
              Clear
            </Link>
          )}
        </form>

        {customers.length === 0 ? (
          <p className="admin-empty">No customers match these filters yet.</p>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Saved</th>
                    <th>Orders</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.userId}>
                      <td>
                        <Link
                          className="admin-row-link"
                          href={`/admin/customers/${c.userId}`}
                          prefetch={false}
                        >
                          {c.name ?? "—"}
                        </Link>
                      </td>
                      <td>{c.email}</td>
                      <td>{c.saved_watches.length}</td>
                      <td>{c.orders.length}</td>
                      <td>{new Date(c.createdAt).toLocaleDateString()}</td>
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
                  <Link className="admin-btn" href={pageHref(q, page - 1)} prefetch={false}>
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
                  <Link className="admin-btn" href={pageHref(q, page + 1)} prefetch={false}>
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
