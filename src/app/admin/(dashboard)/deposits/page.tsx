import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DEPOSIT_STATUSES, depositStatusLabel, isOverdue, type DepositRequest, type DepositStatus } from "@/lib/deposits";
import { formatCents } from "@/lib/admin/types";
import { AdminSearchBar } from "../search-bar";

export const dynamic = "force-dynamic";

type Row = DepositRequest & { product: { productName: string; status: string } | null };

export default async function DepositsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = DEPOSIT_STATUSES.some((s) => s.value === sp.status) ? (sp.status as DepositStatus) : undefined;

  const supabase = await createClient();
  let query = supabase
    .from("deposit_requests")
    .select("*, product:products(productName, status)")
    .order("createdAt", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  if (q) {
    const like = `%${q.replace(/[%_,()]/g, " ")}%`;
    query = query.or(`contactName.ilike.${like},contactEmail.ilike.${like}`);
  }
  const [{ data, error }, { data: all }] = await Promise.all([query, supabase.from("deposit_requests").select("status, holdUntil")]);
  const rows = (data ?? []) as Row[];
  const counts = Object.fromEntries(DEPOSIT_STATUSES.map((s) => [s.value, 0])) as Record<DepositStatus, number>;
  let overdue = 0;
  for (const r of all ?? []) {
    counts[r.status as DepositStatus] += 1;
    if (isOverdue(r as Pick<DepositRequest, "status" | "holdUntil">)) overdue += 1;
  }

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Deposits</p>
        <Link className="admin-btn" href="/admin/deposits/settings">
          Deposit settings
        </Link>
      </header>
      <div className="admin-content">
        <p className="admin-hint" style={{ marginBottom: "var(--space-md)" }}>
          Customers who asked to hold a watch with a deposit. When the payment arrives, open the request and
          confirm it — the watch goes on hold. {overdue > 0 && <strong>{overdue} hold{overdue > 1 ? "s are" : " is"} past the deadline.</strong>}
        </p>
        <AdminSearchBar
          basePath="/admin/deposits"
          q={q}
          placeholder="Search customer name or email"
          ariaLabel="Search deposits"
          status={{
            value: status ?? "",
            ariaLabel: "Filter by status",
            options: [{ value: "", label: "All" }, ...DEPOSIT_STATUSES.map((s) => ({ value: s.value, label: `${s.label} (${counts[s.value]})` }))],
          }}
        />
        {error && (
          <p className="admin-form__error" role="alert">
            Couldn&rsquo;t load deposits ({error.message}). Has the deposits SQL been run?
          </p>
        )}
        {rows.length === 0 ? (
          <p className="admin-empty">No deposit requests {q || status ? "match these filters" : "yet"}.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Watch</th>
                  <th>Customer</th>
                  <th>Deposit</th>
                  <th>Status</th>
                  <th>Hold until</th>
                  <th>Requested</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const late = isOverdue(r);
                  return (
                    <tr key={r.id}>
                      <td>
                        <Link className="admin-row-link" href={`/admin/deposits/${r.id}`} prefetch={false}>
                          {r.product?.productName ?? "Watch removed"}
                        </Link>
                      </td>
                      <td>
                        {r.contactName}
                        <div className="admin-hint">{r.contactEmail}</div>
                      </td>
                      <td>
                        {formatCents(r.amountCents)} <span className="admin-hint">({r.percent}%)</span>
                      </td>
                      <td>
                        <span
                          className="admin-badge"
                          data-tone={late ? "warn" : r.status === "PENDING" ? "active" : r.status === "CONFIRMED" ? "hold" : "draft"}
                        >
                          {late ? "Overdue" : depositStatusLabel(r.status)}
                        </span>
                      </td>
                      <td>{r.holdUntil ? new Date(r.holdUntil).toLocaleDateString() : "—"}</td>
                      <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
