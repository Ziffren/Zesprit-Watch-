"use client";

import { useActionState } from "react";
import { SignedInAs } from "@/components/account-gate";
import type { CustomerProfile } from "@/lib/customer";
import { submitMessage, type SubmitMessageState } from "./actions";
import { useKeepForm } from "@/lib/use-keep-form";

// Shown only to signed-in customers with complete details (see page.tsx).
export function ContactForm({ profile }: { profile: CustomerProfile }) {
  const [state, formAction, pending] = useActionState(submitMessage, { status: "idle" } as SubmitMessageState);
  const keep = useKeepForm(formAction);

  if (state.status === "success") {
    return (
      <div className="order-form__success auth-card">
        <p className="order-form__success-title">Message sent.</p>
        <p>Thank you for reaching out — we&rsquo;ll reply to {profile.email} within one business day.</p>
      </div>
    );
  }

  return (
    <form className="order-form auth-card" action={formAction} onSubmit={keep}>
      <h1 className="order-form__title">Get in touch</h1>
      <p className="order-form__lede">
        Questions about a piece, an order, or anything else — send us a note and we&rsquo;ll reply directly.
      </p>
      <SignedInAs name={profile.name} email={profile.email} phone={profile.phone} />

      <label className="order-form__field">
        <span>Message</span>
        <textarea name="message" rows={5} required />
      </label>

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
