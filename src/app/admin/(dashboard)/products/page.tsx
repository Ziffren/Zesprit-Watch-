import Link from "next/link";
import { getProductStats, listProductsPage } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function pageHref(q: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/products${qs ? `?${qs}` : ""}`;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [{ products, total }, stats] = await Promise.all([
    listProductsPage({ page, pageSize: PAGE_SIZE, q }),
    getProductStats(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Products</p>
        <a
          className="admin-btn"
          href="https://admin.zespritwatch.com/report/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          Add new watch in Watch Report ↗
        </a>
      </header>

      <div className="admin-content">
        <p className="admin-hint" style={{ marginBottom: "var(--space-md)" }}>
          New watches are entered in Watch Report (purchase price, dates, condition).
          This screen edits the catalogue fields — description, photos, tags, collections —
          for watches that are already in inventory.
        </p>

        <div className="admin-stats-row">
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">In stock</span>
            <span className="admin-stat-tile__value">{stats.inStock}</span>
          </div>
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">Purchased this month</span>
            <span className="admin-stat-tile__value">{stats.purchasedThisMonth}</span>
          </div>
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">Sold this month</span>
            <span className="admin-stat-tile__value">{stats.soldThisMonth}</span>
          </div>
        </div>

        <form className="admin-toolbar" action="/admin/products" method="get">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search title or brand…"
            aria-label="Search products"
          />
          <button className="admin-btn" type="submit">
            Search
          </button>
          {q && (
            <Link className="admin-btn admin-btn--ghost" href="/admin/products" prefetch={false}>
              Clear
            </Link>
          )}
        </form>

        {products.length === 0 ? (
          <p className="admin-empty">
            {q
              ? `No products match "${q}".`
              : "No watches yet. Add one in Watch Report first."}
          </p>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th aria-hidden="true"></th>
                    <th>Title</th>
                    <th>Brand</th>
                    <th>Status</th>
                    <th>Collections</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="admin-thumb">
                          {p.photoUrls[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.photoUrls[0]} alt="" loading="lazy" />
                          )}
                        </div>
                      </td>
                      <td>
                        <Link
                          className="admin-row-link"
                          href={`/admin/products/${p.id}`}
                          prefetch={false}
                        >
                          {p.productName}
                        </Link>
                      </td>
                      <td>{p.brand}</td>
                      <td>
                        <span
                          className="admin-badge"
                          data-tone={p.status === "AVAILABLE" ? "active" : "draft"}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td>{p.watch_collections.length}</td>
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
