import { ProgressHold } from "@/components/progress-hold";

// Shown inside the admin card the moment a link is clicked, while the next
// page's data loads. The shape is a generic list page (title, stat tiles,
// table) — close enough to every admin screen that the swap reads as a
// reveal, not a jump.
export default function AdminLoading() {
  return (
    <div className="admin-skeleton" aria-busy="true" aria-label="Loading">
      <ProgressHold />
      <header className="admin-topbar">
        <span className="skel skel--title" />
        <span className="skel skel--button" />
      </header>
      <div className="admin-content">
        <div className="admin-stats-row">
          {[0, 1, 2].map((i) => (
            <div className="admin-stat-tile" key={i}>
              <span className="skel skel--label" />
              <span className="skel skel--value" />
            </div>
          ))}
        </div>
        <div className="admin-table-wrap">
          <div className="skel-table__head">
            <span className="skel skel--label" />
          </div>
          {Array.from({ length: 8 }, (_, i) => (
            <div className="skel-table__row" key={i}>
              <span className="skel skel--thumb" />
              <span className="skel skel--line" style={{ width: `${46 - (i % 3) * 9}%` }} />
              <span className="skel skel--pill" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
