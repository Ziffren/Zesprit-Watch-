import Link from "next/link";
import { listPostsPage } from "@/lib/admin/queries";
import type { PostStatus } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const STATUSES: PostStatus[] = ["DRAFT", "PUBLISHED"];

function pageHref(q: string, status: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/content${qs ? `?${qs}` : ""}`;
}

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = STATUSES.includes(sp.status as PostStatus) ? (sp.status as PostStatus) : undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const { posts, total } = await listPostsPage({ page, pageSize: PAGE_SIZE, q, status });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Content</p>
        <Link className="admin-btn admin-btn--primary" href="/admin/content/new">
          New post
        </Link>
      </header>

      <div className="admin-content">
        <p className="admin-hint" style={{ marginBottom: "var(--space-md)" }}>
          Articles published here appear on the public site&rsquo;s{" "}
          <Link href="/journal">Journal</Link> page. Drafts stay hidden until you switch a post to
          Published.
        </p>

        <form className="admin-toolbar" action="/admin/content" method="get">
          <select name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search title…"
            aria-label="Search posts"
          />
          <button className="admin-btn" type="submit">
            Filter
          </button>
          {(q || status) && (
            <Link className="admin-btn admin-btn--ghost" href="/admin/content" prefetch={false}>
              Clear
            </Link>
          )}
        </form>

        {posts.length === 0 ? (
          <p className="admin-empty">No posts yet. Create the first Journal article.</p>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link className="admin-row-link" href={`/admin/content/${p.id}`} prefetch={false}>
                          {p.title}
                        </Link>
                      </td>
                      <td>
                        <span
                          className="admin-badge"
                          data-tone={p.status === "PUBLISHED" ? "active" : "draft"}
                        >
                          {p.status === "PUBLISHED" ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td>{new Date(p.updatedAt).toLocaleDateString()}</td>
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
