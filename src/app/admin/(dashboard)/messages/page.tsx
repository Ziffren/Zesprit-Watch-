import Link from "next/link";
import { listMessagesPage } from "@/lib/admin/queries";
import type { MessageStatus } from "@/lib/admin/types";
import { AdminSearchBar } from "../search-bar";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const STATUSES: MessageStatus[] = ["UNREAD", "READ"];

function pageHref(q: string, status: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/admin/messages${qs ? `?${qs}` : ""}`;
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = STATUSES.includes(sp.status as MessageStatus) ? (sp.status as MessageStatus) : undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const { messages, total } = await listMessagesPage({ page, pageSize: PAGE_SIZE, q, status });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Messages</p>
      </header>

      <div className="admin-content">
        <p className="admin-hint" style={{ marginBottom: "var(--space-md)" }}>
          Submitted from the public site&rsquo;s{" "}
          <Link href="/contact">Contact</Link> page. A notification email also goes out to the
          address configured for the site, when that&rsquo;s set up.
        </p>

        <AdminSearchBar
          basePath="/admin/messages"
          q={q}
          placeholder="Search name or email"
          ariaLabel="Search messages"
          status={{
            value: status ?? "",
            ariaLabel: "Filter by status",
            options: [
              { value: "", label: "All" },
              { value: "UNREAD", label: "Unread" },
              { value: "READ", label: "Read" },
            ],
          }}
        />

        {messages.length === 0 ? (
          <p className="admin-empty">No messages match these filters yet.</p>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <Link className="admin-row-link" href={`/admin/messages/${m.id}`} prefetch={false}>
                          {m.name}
                        </Link>
                        <div className="admin-hint">{m.email}</div>
                      </td>
                      <td className="admin-table__truncate">{m.message}</td>
                      <td>
                        <span
                          className="admin-badge"
                          data-tone={m.status === "UNREAD" ? "active" : "draft"}
                        >
                          {m.status === "UNREAD" ? "Unread" : "Read"}
                        </span>
                      </td>
                      <td>{new Date(m.createdAt).toLocaleDateString()}</td>
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
