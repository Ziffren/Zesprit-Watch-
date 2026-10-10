import Link from "next/link";
import { listMessagesPage } from "@/lib/admin/queries";
import type { MessageStatus } from "@/lib/admin/types";
import { AdminSearchBar } from "../search-bar";
import { createClient } from "@/lib/supabase/server";
import { initials, parseAbout, relativeTime } from "./message-utils";

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

  const supabase = await createClient();
  // eslint-disable-next-line react-hooks/purity -- server component, rendered once per request
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 86_400_000).toISOString();
  const [{ messages, total }, unreadRes, weekRes, allRes] = await Promise.all([
    listMessagesPage({ page, pageSize: PAGE_SIZE, q, status }),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("status", "UNREAD"),
    supabase.from("messages").select("id", { count: "exact", head: true }).gte("createdAt", weekAgo),
    supabase.from("messages").select("id", { count: "exact", head: true }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Messages</p>
      </header>

      <div className="admin-content">
        <div className="admin-stats-row">
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">Unread</span>
            <span className="admin-stat-tile__value">{unreadRes.count ?? 0}</span>
          </div>
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">Last 7 days</span>
            <span className="admin-stat-tile__value">{weekRes.count ?? 0}</span>
          </div>
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">All messages</span>
            <span className="admin-stat-tile__value">{allRes.count ?? 0}</span>
          </div>
        </div>
        <p className="admin-hint" style={{ marginBottom: "var(--space-md)" }}>
          From the site&rsquo;s &ldquo;Message Me&rdquo; button, the <Link href="/contact">Contact</Link> page and questions
          on product pages — from customers and guests. Each one is also emailed to you.
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
              <table className="admin-table msg-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Message</th>
                    <th>Type</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => {
                    const about = parseAbout(m.message);
                    const unread = m.status === "UNREAD";
                    return (
                      <tr key={m.id} data-unread={unread || undefined}>
                        <td>
                          <Link className="msg-from" href={`/admin/messages/${m.id}`} prefetch={false}>
                            <span className="msg-avatar" aria-hidden="true">
                              {initials(m.name)}
                            </span>
                            <span>
                              <span className="msg-from__name">
                                {unread && <span className="msg-dot" aria-label="Unread" />}
                                {m.name}
                              </span>
                              <span className="admin-hint">{m.email}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="msg-snippet">
                          {about && <span className="msg-about">Re: {about.title}</span>}
                          <span className="admin-table__truncate">{about ? about.body : m.message}</span>
                        </td>
                        <td>
                          <span className="admin-badge" data-tone={m.userId ? "hold" : "draft"}>
                            {m.userId ? "Customer" : "Guest"}
                          </span>
                        </td>
                        <td className="admin-hint" title={new Date(m.createdAt).toLocaleString()}>
                          {relativeTime(m.createdAt, now)}
                        </td>
                      </tr>
                    );
                  })}
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
