"use client";

import { useActionState } from "react";
import { SOURCING_STATUSES } from "@/lib/sourcing";
import { updateSourcing, type UpdateSourcingState } from "../actions";
import { useKeepForm } from "@/lib/use-keep-form";

export function StatusForm({ id, status, adminNote }: { id: string; status: string; adminNote: string | null }) {
  const [state, action, pending] = useActionState(updateSourcing, { error: null, savedAt: null } as UpdateSourcingState);
  // Keep the chosen status/note on screen after saving (a plain form action
  // would reset the select back to the status the page first loaded with).
  const keep = useKeepForm(action);
  return (
    <form className="admin-panel" action={action} onSubmit={keep}>
      <h2>Progress</h2>
      <input type="hidden" name="id" value={id} />
      <label className="admin-field">
        <span>Status</span>
        <select name="status" defaultValue={status}>
          {SOURCING_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="admin-field">
        <span>Private note</span>
        <textarea name="adminNote" rows={5} defaultValue={adminNote ?? ""} placeholder="Leads, prices seen, what you told the customer…" />
      </label>
      {state.error && (
        <p className="admin-form__error" role="alert">
          {state.error}
        </p>
      )}
      <div className="admin-form__actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <span className="admin-hint" aria-live="polite">
          {state.savedAt ? "Saved" : "The customer sees the status, not the note."}
        </span>
        <button className="admin-btn admin-btn--primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
