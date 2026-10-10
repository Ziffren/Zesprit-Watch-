"use client";

import { useActionState } from "react";
import { SignedInAs } from "@/components/account-gate";
import type { CustomerProfile } from "@/lib/customer";
import { submitOrder, type SubmitOrderState } from "./actions";
import { useKeepForm } from "@/lib/use-keep-form";

// Shown only to signed-in customers with complete details (see page.tsx).
export function OrderForm({ watchId, profile }: { watchId: string; profile: CustomerProfile }) {
  const action = submitOrder.bind(null, watchId);
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as SubmitOrderState);
  const keep = useKeepForm(formAction);

  if (state.status === "success") {
    return (
      <div className="order-form__success">
        <p className="order-form__success-title">Purchase request sent.</p>
        <p>
          Thank you — we&rsquo;ll be in touch within one business day to talk through the piece and next steps.
          You can follow it under <a href="/account">your account</a>.
        </p>
      </div>
    );
  }

  return (
    <form className="order-form" action={formAction} onSubmit={keep}>
      <h2 className="order-form__title">Buy it now</h2>
      <p className="order-form__lede">
        Send us your purchase request — we&rsquo;ll contact you to confirm payment and shipping. No payment is taken here.
      </p>
      <SignedInAs name={profile.name} email={profile.email} phone={profile.phone} />

      <label className="order-form__field">
        <span>Message (optional)</span>
        <textarea name="message" rows={3} placeholder="Anything we should know?" />
      </label>

      {state.status === "error" && (
        <p className="order-form__error" role="alert">
          {state.message}
        </p>
      )}

      <button className="cta-solid" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send purchase request"}
      </button>
    </form>
  );
}
