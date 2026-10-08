"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="admin-content">
      <div className="admin-panel" style={{ boxShadow: "0 0 0 1px var(--color-accent-2)" }}>
        <h2 style={{ color: "var(--color-accent-2)" }}>Something went wrong loading this page</h2>
        <p className="admin-hint">{error.message}</p>
        <div>
          <button className="admin-btn admin-btn--primary" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
