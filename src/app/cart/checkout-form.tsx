"use client";

import { useActionState, useEffect } from "react";
import { SignedInAs } from "@/components/account-gate";
import type { CustomerProfile } from "@/lib/customer";
import { notifyCounts } from "@/lib/store-events";
import { useKeepForm } from "@/lib/use-keep-form";
import { checkoutCart, type CheckoutState } from "./actions";

export function CheckoutForm({ profile, count }: { profile: CustomerProfile; count: number }) {
  const [state, action, pending] = useActionState(checkoutCart, { status: "idle" } as CheckoutState);
  const keep = useKeepForm(action);
  useEffect(() => {
    if (state.status === "success") notifyCounts();
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="cart-summary" role="status">
        <p className="sold-panel__title">Purchase request sent.</p>
        <p>
          Thank you — we&rsquo;ll contact you at {profile.email} within one business day to confirm payment and shipping for{" "}
          {state.count === 1 ? "your watch" : `your ${state.count} watches`}. You can follow it on <a href="/account">your account</a>.
        </p>
      </div>
    );
  }

  return (
    <form className="cart-summary" action={action} onSubmit={keep}>
      <SignedInAs name={profile.name} email={profile.email} phone={profile.phone} />
      <label className="order-form__field">
        <span>Note (optional)</span>
        <textarea name="note" rows={3} placeholder="Shipping country, questions, anything we should know" />
      </label>
      {state.status === "error" && (
        <p className="order-form__error" role="alert">
          {state.message}
        </p>
      )}
      <button className="buy-btn buy-btn--primary" type="submit" disabled={pending || count === 0}>
        {pending ? "Sending…" : `Send purchase request${count > 1 ? ` · ${count} watches` : ""}`}
      </button>
      <p className="buy-note">No payment is taken online — we confirm everything with you first.</p>
    </form>
  );
}
