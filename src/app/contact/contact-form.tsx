"use client";

import { useActionState } from "react";
import { submitMessage, type SubmitMessageState } from "./actions";

export function ContactForm() {
  const initialState: SubmitMessageState = { status: "idle" };
  const [state, formAction, pending] = useActionState(submitMessage, initialState);

  if (state.status === "success") {
    return (
      <div className="order-form__success auth-card">
        <p className="order-form__success-title">Message sent.</p>
        <p>Thank you for reaching out — we&rsquo;ll reply within one business day.</p>
      </div>
    );
  }

  return (
    <form className="order-form auth-card" action={formAction}>
      <h1 className="order-form__title">Get in touch</h1>
      <p className="order-form__lede">
        Questions about a piece, an order, or anything else — send us a note and we&rsquo;ll
        reply directly.
      </p>

      <label className="order-form__field">
        <span>Name</span>
        <input type="text" name="name" autoComplete="name" required />
      </label>

      <label className="order-form__field">
        <span>Email</span>
        <input type="email" name="email" autoComplete="email" required />
      </label>

      <label className="order-form__field">
        <span>Phone (optional)</span>
        <input type="tel" name="phone" autoComplete="tel" />
      </label>

      <label className="order-form__field">
        <span>Message</span>
        <textarea name="message" rows={5} required />
      </label>

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
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
