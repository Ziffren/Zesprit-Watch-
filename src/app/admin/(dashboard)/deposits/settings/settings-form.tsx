"use client";

import { useActionState } from "react";
import type { ShopSettings } from "@/lib/deposits";
import { useKeepForm } from "@/lib/use-keep-form";
import { saveShopSettings, type SettingsState } from "../actions";

export function SettingsForm({ settings }: { settings: ShopSettings }) {
  const [state, action, pending] = useActionState(saveShopSettings, { error: null, savedAt: null } as SettingsState);
  const keep = useKeepForm(action);
  return (
    <form className="admin-panel" style={{ maxWidth: "44rem" }} action={action} onSubmit={keep}>
      <div className="price-grid price-grid--sale">
        <label className="admin-field">
          <span>Deposit (% of the price)</span>
          <input name="depositPercent" type="number" min={1} max={100} step={1} defaultValue={settings.depositPercent} required />
        </label>
        <label className="admin-field">
          <span>Hold period (days)</span>
          <input name="holdDays" type="number" min={1} max={90} step={1} defaultValue={settings.holdDays} required />
        </label>
      </div>
      <label className="admin-field">
        <span>Payment instructions</span>
        <textarea
          name="paymentInstructions"
          rows={7}
          defaultValue={settings.paymentInstructions ?? ""}
          placeholder={"e.g.\nBank: …\nBranch: …\nAccount name: …\nAccount number: …\nOr PayPal: …\nPlease include your name as the reference."}
        />
      </label>
      <p className="admin-hint">
        Shown to the customer after they request a deposit and sent in their confirmation email. Existing requests keep the
        amount they were given.
      </p>
      {state.error && (
        <p className="admin-form__error" role="alert">
          {state.error}
        </p>
      )}
      <div className="admin-form__actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <span className="admin-hint" aria-live="polite">
          {state.savedAt ? "Saved" : ""}
        </span>
        <button className="admin-btn admin-btn--primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
