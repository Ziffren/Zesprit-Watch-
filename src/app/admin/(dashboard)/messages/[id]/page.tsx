import Link from "next/link";
import { notFound } from "next/navigation";
import { getMessage } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";
import { deleteMessage, setMessageStatus } from "../actions";
import { initials, parseAbout } from "../message-utils";

export const dynamic = "force-dynamic";

export default async function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const message = await getMessage(id);
  if (!message) notFound();

  // Opening a message reads it — same convention as any inbox.
  const wasUnread = message.status === "UNREAD";
  if (wasUnread) {
    const supabase = await createClient();
    await supabase.from("messages").update({ status: "READ" }).eq("id", id);
  }
  const status = wasUnread ? "READ" : message.status;
  const about = parseAbout(message.message);
  const subject = encodeURIComponent(about ? `Re: ${about.title}` : "Re: your message to Z’esprit Watch");
  const quoted = encodeURIComponent(`\n\n— On ${new Date(message.createdAt).toLocaleString()}, ${message.name} wrote:\n> ${(about?.body ?? message.message).split("\n").join("\n> ")}`);

  return (
    <>
      <header className="admin-topbar admin-topbar--product">
        <div>
          <Link className="admin-breadcrumb" href="/admin/messages">
            ← Messages
          </Link>
          <div className="admin-topbar__heading">
            <p className="admin-topbar__title">{message.name}</p>
            <span className="admin-badge" data-tone={message.userId ? "hold" : "draft"}>
              {message.userId ? "Customer" : "Guest"}
            </span>
          </div>
        </div>
        <a className="admin-btn admin-btn--primary" href={`mailto:${message.email}?subject=${subject}&body=${quoted}`}>
          Reply by email
        </a>
      </header>

      <div className="admin-content">
        <div className="admin-form">
          <div className="admin-form__main">
            {about && (
              <div className="admin-panel msg-about-panel">
                <span className="admin-hint">Question about</span>
                {about.url ? (
                  <a href={about.url} target="_blank" rel="noopener noreferrer">
                    {about.title} ↗
                  </a>
                ) : (
                  <strong>{about.title}</strong>
                )}
              </div>
            )}
            <div className="admin-panel">
              <div className="msg-head">
                <span className="msg-avatar msg-avatar--lg" aria-hidden="true">
                  {initials(message.name)}
                </span>
                <div>
                  <strong>{message.name}</strong>
                  <div className="admin-hint">{new Date(message.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="msg-bubble">{about ? about.body : message.message}</div>
            </div>
          </div>

          <div className="admin-form__side">
            <div className="admin-panel">
              <h2>From</h2>
              <dl className="admin-dl">
                <dt>Name</dt>
                <dd>{message.name}</dd>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${message.email}`}>{message.email}</a>
                </dd>
                <dt>Phone</dt>
                <dd>{message.phone ?? "—"}</dd>
                <dt>Account</dt>
                <dd>
                  {message.userId ? (
                    <Link href={`/admin/customers/${message.userId}`}>View customer →</Link>
                  ) : (
                    "Guest — no account"
                  )}
                </dd>
              </dl>
            </div>

            <div className="admin-panel">
              <h2>Status</h2>
              <p>
                <span className="admin-badge" data-tone={status === "UNREAD" ? "active" : "draft"}>
                  {status === "UNREAD" ? "Unread" : "Read"}
                </span>
              </p>
              <div className="msg-actions">
                <form action={setMessageStatus}>
                  <input type="hidden" name="id" value={message.id} />
                  <input type="hidden" name="status" value={status === "UNREAD" ? "READ" : "UNREAD"} />
                  <button className="admin-btn" type="submit">
                    Mark as {status === "UNREAD" ? "read" : "unread"}
                  </button>
                </form>
                <form action={deleteMessage}>
                  <input type="hidden" name="id" value={message.id} />
                  <button className="admin-btn admin-btn--danger" type="submit">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
