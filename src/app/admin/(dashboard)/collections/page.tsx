import Link from "next/link";
import { listCollections } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collections = await listCollections();

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Collections</p>
        <Link className="admin-btn admin-btn--primary" href="/admin/collections/new">
          Create collection
        </Link>
      </header>

      <div className="admin-content">
        {collections.length === 0 ? (
          <p className="admin-empty">
            No collections yet. Collections group watches by a specialty theme (e.g.
            &ldquo;Chronographs&rdquo;) — brand grouping already works directly, no collection
            needed.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Watches</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link
                        className="admin-row-link"
                        href={`/admin/collections/${c.id}`}
                        prefetch={false}
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td>
                      <span className="admin-badge" data-tone={c.isBrand ? "active" : "draft"}>
                        {c.isBrand ? "Brand" : "Collection"}
                      </span>
                    </td>
                    <td>{c.product_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
