import Link from "next/link";
import {
  getAnalyticsOverview,
  getDailyTraffic,
  getDeviceStats,
  getSessionLocations,
  getTopCustomersBySpend,
  getTopViewedProducts,
} from "@/lib/admin/queries";
import { formatCents } from "@/lib/admin/types";
import { BarList } from "./bar-list";
import { TrafficChart } from "./traffic-chart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [overview, traffic, topProducts, locations, devices, topCustomers] = await Promise.all([
    getAnalyticsOverview(),
    getDailyTraffic(30),
    getTopViewedProducts(8),
    getSessionLocations(8),
    getDeviceStats(),
    getTopCustomersBySpend(8),
  ]);
  const deviceTotal = devices.reduce((sum, d) => sum + d.visitors, 0);

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">Analytics</p>
      </header>

      <div className="admin-content">
        <p className="admin-hint" style={{ marginBottom: "var(--space-md)" }}>
          Revenue here is the agreed price on confirmed/fulfilled orders — purchase cost and
          margin stay in Watch Report, which this app never reads.
        </p>

        <div className="admin-stats-row">
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">Visits (30d)</span>
            <span className="admin-stat-tile__value">{overview.totalVisits30d}</span>
          </div>
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">Unique visitors (30d)</span>
            <span className="admin-stat-tile__value">{overview.uniqueVisitors30d}</span>
          </div>
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">Live now</span>
            <span className="admin-stat-tile__value">{overview.liveNow}</span>
          </div>
        </div>

        <div className="admin-stats-row">
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">Returning visitors (30d)</span>
            <span className="admin-stat-tile__value">{overview.returningVisitors30d}</span>
          </div>
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">Revenue (confirmed+fulfilled)</span>
            <span className="admin-stat-tile__value">{formatCents(overview.totalRevenueCents)}</span>
          </div>
          <div className="admin-stat-tile">
            <span className="admin-stat-tile__label">Orders (confirmed+fulfilled)</span>
            <span className="admin-stat-tile__value">{overview.ordersCount}</span>
          </div>
        </div>

        <div className="admin-panel">
          <h2>Traffic, last 30 days</h2>
          <p className="admin-hint">Page views per day across the whole public site.</p>
          <TrafficChart data={traffic} />
        </div>

        <div className="admin-form">
          <div className="admin-form__main">
            <div className="admin-panel">
              <h2>Most-viewed pieces</h2>
              <BarList
                items={topProducts.map((p) => ({
                  label: p.productName,
                  sublabel: p.brand,
                  value: p.views,
                  valueLabel: String(p.views),
                }))}
              />
            </div>

            <div className="admin-panel">
              <h2>Top customers by spend</h2>
              {topCustomers.length === 0 ? (
                <p className="admin-hint">No confirmed orders with an account attached yet.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Orders</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCustomers.map((c) => (
                        <tr key={c.userId}>
                          <td>
                            <Link className="admin-row-link" href={`/admin/customers/${c.userId}`}>
                              {c.name ?? c.email}
                            </Link>
                            <div className="admin-hint">{c.email}</div>
                          </td>
                          <td>{c.orderCount}</td>
                          <td>{formatCents(c.totalCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="admin-form__side">
            <div className="admin-panel">
              <h2>Sessions by location</h2>
              <BarList
                items={locations.map((l) => ({
                  label: [l.country, l.region, l.city].filter(Boolean).join(" · "),
                  value: l.visitors,
                  valueLabel: String(l.visitors),
                }))}
              />
            </div>

            <div className="admin-panel">
              <h2>Devices</h2>
              <p className="admin-hint">
                Aggregate mix only — no per-visitor device or IP data is collected.
              </p>
              <BarList
                items={devices.map((d) => ({
                  label: d.device,
                  value: d.visitors,
                  valueLabel:
                    deviceTotal > 0 ? `${Math.round((d.visitors / deviceTotal) * 100)}%` : "0%",
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
