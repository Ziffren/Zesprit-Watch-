"use client";

import { useActionState } from "react";
import { depositAction, type DepositActionState } from "../actions";

// One button per allowed next step. Each submits {id, op}.
export function DepositActions({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState(depositAction, { error: null, done: null } as DepositActionState);

  const btn = (op: string, label: string, tone?: "primary" | "danger", confirmText?: string) => (
    <button
      className={`admin-btn${tone ? ` admin-btn--${tone}` : ""}`}
      type="submit"
      name="op"
      value={op}
      disabled={pending}
      onClick={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {label}
    </button>
  );

  return (
    <form className="admin-panel" action={action}>
      <h2>Next step</h2>
      <input type="hidden" name="id" value={id} />
      {status === "PENDING" && (
        <>
          <p className="admin-hint">When the deposit has arrived in your account:</p>
          {btn("confirm", "Confirm deposit received → hold watch", "primary")}
          {btn("cancel", "Cancel request", "danger", "Cancel this deposit request?")}
        </>
      )}
      {status === "CONFIRMED" && (
        <>
          <p className="admin-hint">Once the balance is paid, mark the sale. If the customer backs out, cancel to release the watch.</p>
          {btn("complete", "Balance paid → mark watch sold", "primary", "Mark this watch as sold?")}
          {btn("cancel", "Cancel & release watch", "danger", "Cancel the deposit and make the watch available again?")}
        </>
      )}
      {(status === "COMPLETED" || status === "CANCELLED") && <p className="admin-hint">This deposit is closed.</p>}
      {state.error && (
        <p className="admin-form__error" role="alert">
          {state.error}
        </p>
      )}
      {state.done && (
        <p className="admin-hint" role="status">
          ✓ {state.done}
        </p>
      )}
    </form>
  );
}
