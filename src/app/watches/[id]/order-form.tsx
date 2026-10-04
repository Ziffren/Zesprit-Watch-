"use client";

import { useActionState } from "react";
import { submitOrder, type SubmitOrderState } from "./actions";

export function OrderForm({ watchId }: { watchId: string }) {
  const action = submitOrder.bind(null, watchId);
  const initialState: SubmitOrderState = { status: "idle" };
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.status === "success") {
    return (
      <div className="order-form__success">
        <p className="order-form__success-title">Request sent.</p>
        <p>
          Thank you — we&rsquo;ve received your request and will be in touch within one
          business day to talk through the piece and next steps.
        </p>
      </div>
    );
  }

  return (
    <form className="order-form" action={formAction}>
      <h2 className="order-form__title">Request this piece</h2>
      <p className="order-form__lede">
        Tell us a little about you and we&rsquo;ll follow up directly — no payment is taken
        here.
      </p>

      <label className="order-form__field">
        <span>Name</span>
        <input type="text" name="customerName" autoComplete="name" required />
      </label>

      <label className="order-form__field">
        <span>Email</span>
        <input type="email" name="customerEmail" autoComplete="email" required />
      </label>

      <label className="order-form__field">
        <span>Phone (optional)</span>
        <input type="tel" name="customerPhone" autoComplete="tel" />
      </label>

      <label className="order-form__field">
        <span>Message (optional)</span>
        <textarea name="message" rows={3} placeholder="Anything we should know?" />
      </label>

      {/* Honeypot — hidden from real visitors via CSS, not `type="hidden"`,
          so basic bots that only skip hidden inputs still fill it. */}
      <div className="order-form__honeypot" aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.status === "error" && (
        <p className="order-form__error" role="alert">
          {state.message}
        </p>
      )}

      <button className="cta-solid" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
