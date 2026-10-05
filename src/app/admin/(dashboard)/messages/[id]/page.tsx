import { notFound } from "next/navigation";
import { getMessage } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";
import { deleteMessage, setMessageStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">{message.name}</p>
      </header>

      <div className="admin-content">
        <div className="admin-form">
          <div className="admin-form__main">
            <div className="admin-panel">
              <h2>Message</h2>
              <p style={{ whiteSpace: "pre-wrap" }}>{message.message}</p>
            </div>
          </div>

          <div className="admin-form__side">
            <div className="admin-panel">
              <h2>From</h2>
              <p>
                <strong>{message.name}</strong>
              </p>
              <p className="admin-hint">
                <a href={`mailto:${message.email}`}>{message.email}</a>
              </p>
              {message.phone && <p className="admin-hint">{message.phone}</p>}
              <p className="admin-hint">
                Received {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="admin-panel">
              <h2>Status</h2>
              <span
                className="admin-badge"
                data-tone={status === "UNREAD" ? "active" : "draft"}
              >
                {status === "UNREAD" ? "Unread" : "Read"}
              </span>
              <form action={setMessageStatus} style={{ marginTop: "var(--space-sm)" }}>
                <input type="hidden" name="id" value={message.id} />
                <input
                  type="hidden"
                  name="status"
                  value={status === "UNREAD" ? "READ" : "UNREAD"}
                />
                <button className="admin-btn" type="submit">
                  Mark as {status === "UNREAD" ? "read" : "unread"}
                </button>
              </form>
            </div>

            <form action={deleteMessage}>
              <input type="hidden" name="id" value={message.id} />
              <button className="admin-btn admin-btn--danger" type="submit">
                Delete
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
