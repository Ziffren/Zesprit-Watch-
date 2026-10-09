import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { depositStatusLabel, isOverdue, type DepositRequest } from "@/lib/deposits";
import { formatCents } from "@/lib/admin/types";
import { DepositActions } from "./deposit-actions";

export const dynamic = "force-dynamic";

type Row = DepositRequest & { product: { id: string; productName: string; status: string; priceCents: number | null } | null };

export default async function DepositDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("deposit_requests")
    .select("*, product:products(id, productName, status, priceCents)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const d = data as Row;
  const late = isOverdue(d);

  return (
    <>
      <header className="admin-topbar admin-topbar--product">
        <div>
          <Link className="admin-breadcrumb" href="/admin/deposits">
            ← Deposits
          </Link>
          <div className="admin-topbar__heading">
            <p className="admin-topbar__title">{d.product?.productName ?? "Watch removed"}</p>
            <span className="admin-badge" data-tone={late ? "warn" : d.status === "CONFIRMED" ? "hold" : d.status === "PENDING" ? "active" : "draft"}>
              {late ? "Overdue" : depositStatusLabel(d.status)}
            </span>
          </div>
        </div>
      </header>
      <div className="admin-content">
        <div className="admin-form">
          <div className="admin-form__main">
            <div className="admin-panel">
              <h2>Deposit</h2>
              <dl className="admin-dl">
                <dt>Amount</dt>
                <dd>
                  <strong>{formatCents(d.amountCents)}</strong> ({d.percent}% of {formatCents(d.product?.priceCents ?? null)})
                </dd>
                <dt>Requested</dt>
                <dd>{new Date(d.createdAt).toLocaleString()}</dd>
                <dt>Payment confirmed</dt>
                <dd>{d.confirmedAt ? new Date(d.confirmedAt).toLocaleString() : "Not yet"}</dd>
                <dt>Held until</dt>
                <dd>
                  {d.holdUntil ? new Date(d.holdUntil).toLocaleDateString() : "—"}
                  {late && <strong className="admin-dl__warn"> · past the deadline — contact the customer</strong>}
                </dd>
                <dt>Watch status</dt>
                <dd>
                  {d.product ? (
                    <Link href={`/admin/products/${d.product.id}`}>
                      {d.product.status} — open product →
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </dl>
              {d.message && (
                <>
                  <h3 className="admin-dl__sub">Customer message</h3>
                  <p style={{ whiteSpace: "pre-line" }}>{d.message}</p>
                </>
              )}
            </div>
          </div>
          <div className="admin-form__side">
            <div className="admin-panel">
              <h2>Customer</h2>
              <p>
                <strong>{d.contactName}</strong>
              </p>
              <p className="admin-hint">
                <a href={`mailto:${d.contactEmail}`}>{d.contactEmail}</a>
              </p>
              {d.contactPhone && <p className="admin-hint">{d.contactPhone}</p>}
              <p className="admin-hint">
                <Link href={`/admin/customers/${d.userId}`}>View customer →</Link>
              </p>
            </div>
            <DepositActions id={d.id} status={d.status} />
          </div>
        </div>
      </div>
    </>
  );
}
