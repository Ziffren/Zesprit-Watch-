import type { DailyTraffic } from "@/lib/admin/types";

const WIDTH = 760;
const HEIGHT = 220;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 28;
const PAD_BOTTOM = 28;

// Single-series trend over time — one hue (the site's existing accent),
// 2px line, ~10% opacity area wash, hairline baseline, direct labels only
// at the max and the latest point (never a number on every day).
export function TrafficChart({ data }: { data: DailyTraffic[] }) {
  if (data.length === 0) {
    return <p className="admin-hint">No traffic yet.</p>;
  }

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const maxViews = Math.max(1, ...data.map((d) => d.views));

  const points = data.map((d, i) => {
    const x = PAD_LEFT + (data.length === 1 ? 0 : (i / (data.length - 1)) * plotW);
    const y = PAD_TOP + plotH - (d.views / maxViews) * plotH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const baselineY = PAD_TOP + plotH;
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${baselineY} L${points[0].x.toFixed(1)},${baselineY} Z`;

  const maxPoint = points.reduce((a, b) => (b.views > a.views ? b : a), points[0]);
  const lastPoint = points[points.length - 1];

  const firstLabel = new Date(data[0].day).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const lastLabel = new Date(data[data.length - 1].day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <svg
      className="analytics-traffic-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Page views per day, last ${data.length} days, peaking at ${maxPoint.views}`}
    >
      <line
        x1={PAD_LEFT}
        y1={baselineY}
        x2={WIDTH - PAD_RIGHT}
        y2={baselineY}
        stroke="var(--color-rule)"
        strokeWidth="1"
      />
      <path d={areaPath} fill="var(--color-accent-2)" fillOpacity="0.1" stroke="none" />
      <path d={linePath} fill="none" stroke="var(--color-accent-2)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* End markers with a surface ring */}
      <circle cx={maxPoint.x} cy={maxPoint.y} r="4" fill="var(--color-accent-2)" stroke="var(--color-paper)" strokeWidth="2" />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill="var(--color-accent-2)" stroke="var(--color-paper)" strokeWidth="2" />

      {/* Direct labels — selective: the peak and the latest value only */}
      <text x={maxPoint.x} y={Math.max(12, maxPoint.y - 10)} textAnchor="middle" className="analytics-chart-label">
        {maxPoint.views}
      </text>
      <text x={lastPoint.x} y={Math.max(12, lastPoint.y - 10)} textAnchor="end" className="analytics-chart-label">
        {lastPoint.views}
      </text>

      <text x={PAD_LEFT} y={HEIGHT - 6} className="analytics-chart-axis-label">
        {firstLabel}
      </text>
      <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 6} textAnchor="end" className="analytics-chart-axis-label">
        {lastLabel}
      </text>
    </svg>
  );
}
