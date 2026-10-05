import Link from "next/link";
import {
  getAnalyticsOverview,
  getCountryStats,
  getDailyTraffic,
  getTopCustomersBySpend,
  getTopViewedProducts,
} from "@/lib/admin/queries";
import { formatCents } from "@/lib/admin/types";
import { BarList } from "./bar-list";
import { TrafficChart } from "./traffic-chart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [overview, traffic, topProducts, countries, topCustomers] = await Promise.all([
    getAnalyticsOverview(),
    getDailyTraffic(30),
    getTopViewedProducts(8),
    getCountryStats(8),
    getTopCustomersBySpend(8),
  ]);

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
              <h2>Visitors by country</h2>
              <BarList
                items={countries.map((c) => ({
                  label: c.country,
                  value: c.visitors,
                  valueLabel: String(c.visitors),
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
