"use client";

import { useActionState, useState } from "react";
import { SignedInAs } from "@/components/account-gate";
import { useKeepForm } from "@/lib/use-keep-form";
import { submitMessage, type SubmitMessageState } from "@/app/contact/actions";

export type MessageProfile = { name: string | null; email: string; phone: string | null };

// Shared "Message Me" form (header dialog + Contact page). Signed-in
// customers just write; guests also give a name and email to reply to.
export function MessageForm({ profile, title = "Message me" }: { profile: MessageProfile | null; title?: string }) {
  const [state, action, pending] = useActionState(submitMessage, { status: "idle" } as SubmitMessageState);
  const keep = useKeepForm(action);
  const [startedAt] = useState(() => Date.now());

  if (state.status === "success") {
    return (
      <div className="order-form__success message-sent" role="status">
        <p className="order-form__success-title">Message sent.</p>
        <p>
          Thank you — we&rsquo;ll reply {state.email || profile?.email ? <>to {state.email || profile?.email} </> : ""}within one
          business day.
        </p>
      </div>
    );
  }

  return (
    <form className="order-form message-form" action={action} onSubmit={keep}>
      <h2 className="order-form__title">{title}</h2>
      <p className="order-form__lede">Questions about a piece, an order, or anything else — we reply personally.</p>
      <input type="hidden" name="startedAt" value={startedAt} />

      {profile ? (
        <SignedInAs name={profile.name} email={profile.email} phone={profile.phone} />
      ) : (
        <>
          <div className="sourcing-row">
            <label className="order-form__field">
              <span>Name</span>
              <input name="name" autoComplete="name" required maxLength={120} />
            </label>
            <label className="order-form__field">
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required maxLength={200} />
            </label>
          </div>
          <label className="order-form__field">
            <span>Phone (optional)</span>
            <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
          </label>
        </>
      )}

      <label className="order-form__field">
        <span>Message</span>
        <textarea name="message" rows={5} required maxLength={5000} />
      </label>

      {/* Honeypot — hidden from people with CSS, not type="hidden", so simple bots fill it. */}
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
      {!profile && (
        <p className="message-form__note">
          Have an account? <a href="/account/login">Sign in</a> and we&rsquo;ll fill in your details.
        </p>
      )}
    </form>
  );
}
