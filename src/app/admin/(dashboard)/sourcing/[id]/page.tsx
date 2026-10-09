import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BOX_PAPERS,
  CONDITIONS,
  CONTACT_METHODS,
  SOURCING_STATUSES,
  formatBudget,
  labelOf,
  type SourcingRequest,
} from "@/lib/sourcing";
import { StatusForm } from "./status-form";

export const dynamic = "force-dynamic";

export default async function SourcingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, { data: note }] = await Promise.all([
    supabase.from("sourcing_requests").select("*").eq("id", id).maybeSingle(),
    supabase.from("sourcing_notes").select("note").eq("requestId", id).maybeSingle(),
  ]);
  if (!data) notFound();
  const r = data as SourcingRequest;

  return (
    <>
      <header className="admin-topbar admin-topbar--product">
        <div>
          <Link className="admin-breadcrumb" href="/admin/sourcing">
            ← Sourcing
          </Link>
          <div className="admin-topbar__heading">
            <p className="admin-topbar__title">
              {r.brand} {r.model}
            </p>
            <span className="admin-badge" data-tone={r.status === "NEW" ? "active" : "draft"}>
              {labelOf(SOURCING_STATUSES, r.status)}
            </span>
          </div>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-form">
          <div className="admin-form__main">
            <div className="admin-panel">
              <h2>What they&rsquo;re looking for</h2>
              <dl className="admin-dl">
                <dt>Brand</dt>
                <dd>{r.brand}</dd>
                <dt>Model / reference</dt>
                <dd>{r.model ?? "—"}</dd>
                <dt>Budget</dt>
                <dd>{formatBudget(r.minPriceCents, r.maxPriceCents)}</dd>
                <dt>Condition</dt>
                <dd>{labelOf(CONDITIONS, r.condition)}</dd>
                <dt>Box &amp; papers</dt>
                <dd>{labelOf(BOX_PAPERS, r.boxPapers)}</dd>
              </dl>
              {r.details && (
                <>
                  <h3 className="admin-dl__sub">Details</h3>
                  <p style={{ whiteSpace: "pre-line" }}>{r.details}</p>
                </>
              )}
            </div>

            <div className="admin-panel">
              <h2>Reference links</h2>
              {r.referenceLinks.length === 0 ? (
                <p className="admin-hint">None given.</p>
              ) : (
                <ul className="admin-links">
                  {r.referenceLinks.map((l) => (
                    <li key={l}>
                      <a href={l} target="_blank" rel="noopener noreferrer nofollow">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="admin-form__side">
            <div className="admin-panel">
              <h2>Contact</h2>
              <p>
                <strong>{r.contactName}</strong>
              </p>
              <p className="admin-hint">
                <a href={`mailto:${r.contactEmail}`}>{r.contactEmail}</a>
              </p>
              {r.contactPhone && <p className="admin-hint">{r.contactPhone}</p>}
              <p className="admin-hint">Prefers {labelOf(CONTACT_METHODS, r.contactMethod)}</p>
              <p className="admin-hint">
                <Link href={`/admin/customers/${r.userId}`}>View customer →</Link>
              </p>
              <p className="admin-hint">Received {new Date(r.createdAt).toLocaleString()}</p>
            </div>

            <StatusForm id={r.id} status={r.status} adminNote={note?.note ?? null} />
          </div>
        </div>
      </div>
    </>
  );
}
