// A single-series magnitude comparison (sequential color job — one hue, bar
// length does the encoding, matching dataviz's "nominal categories get one
// color, never a value-ramp" rule). Value is direct-labeled at the bar end
// per spec; no legend needed for a single series.
export function BarList({
  items,
}: {
  items: { label: string; sublabel?: string; value: number; valueLabel: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  if (items.length === 0) {
    return <p className="admin-hint">No data yet.</p>;
  }

  return (
    <ul className="analytics-bar-list">
      {items.map((item) => (
        <li key={item.label + (item.sublabel ?? "")} className="analytics-bar-list__row">
          <div className="analytics-bar-list__label">
            <span>{item.label}</span>
            {item.sublabel && <span className="admin-hint">{item.sublabel}</span>}
          </div>
          <div className="analytics-bar-list__track">
            <div
              className="analytics-bar-list__fill"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="analytics-bar-list__value">{item.valueLabel}</span>
        </li>
      ))}
    </ul>
  );
}
