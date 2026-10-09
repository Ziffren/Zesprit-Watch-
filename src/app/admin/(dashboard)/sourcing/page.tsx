import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  BOX_PAPERS,
  CONDITIONS,
  SOURCING_STATUSES,
  formatBudget,
  labelOf,
  type SourcingRequest,
  type SourcingStatus,
} from "@/lib/sourcing";
import { AdminSearchBar } from "../search-bar";

export const dynamic = "force-dynamic";

export default async function SourcingListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = SOURCING_STATUSES.some((s) => s.value === sp.status) ? (sp.status as SourcingStatus) : undefined;

  const supabase = await createClient();
  let query = supabase
    .from("sourcing_requests")
    .select("*")
    .order("createdAt", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  if (q) {
    const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    query = query.or(`brand.ilike.${like},model.ilike.${like},contactName.ilike.${like},contactEmail.ilike.${like}`);
  }
  const [{ data, error }, { data: all }] = await Promise.all([
    query,
    supabase.from("sourcing_requests").select("status"),
  ]);
  const rows = (data ?? []) as SourcingRequest[];
  const counts = Object.fromEntries(SOURCING_STATUSES.map((s) => [s.value, 0])) as Record<SourcingStatus, number>;
  for (const r of all ?? []) counts[r.status as SourcingStatus] += 1;

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Sourcing</p>
      </header>
      <div className="admin-content">
        <p className="admin-hint" style={{ marginBottom: "var(--space-md)" }}>
          Watches customers have asked you to find, from the Watch Sourcing page. Move each one along as you
          search, and keep private notes on the request.
        </p>

        <AdminSearchBar
          basePath="/admin/sourcing"
          q={q}
          placeholder="Search brand, model, name or email"
          ariaLabel="Search sourcing requests"
          status={{
            value: status ?? "",
            ariaLabel: "Filter by status",
            options: [
              { value: "", label: "All" },
              ...SOURCING_STATUSES.map((s) => ({ value: s.value, label: `${s.label} (${counts[s.value]})` })),
            ],
          }}
        />

        {error && (
          <p className="admin-form__error" role="alert">
            Couldn&rsquo;t load requests ({error.message}). Has the sourcing_requests SQL been run?
          </p>
        )}

        {rows.length === 0 ? (
          <p className="admin-empty">No sourcing requests {q || status ? "match these filters" : "yet"}.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Watch</th>
                  <th>Customer</th>
                  <th>Budget</th>
                  <th>Condition · set</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link className="admin-row-link" href={`/admin/sourcing/${r.id}`} prefetch={false}>
                        <strong>{r.brand}</strong> {r.model}
                      </Link>
                    </td>
                    <td>
                      {r.contactName}
                      <div className="admin-hint">{r.contactEmail}</div>
                    </td>
                    <td>{formatBudget(r.minPriceCents, r.maxPriceCents)}</td>
                    <td className="admin-hint">
                      {labelOf(CONDITIONS, r.condition).split(" —")[0]} · {labelOf(BOX_PAPERS, r.boxPapers).split(" —")[0]}
                    </td>
                    <td>
                      <span className="admin-badge" data-tone={r.status === "NEW" ? "active" : "draft"}>
                        {labelOf(SOURCING_STATUSES, r.status)}
                      </span>
                    </td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
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
