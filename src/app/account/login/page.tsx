"use client";

import { use, useActionState } from "react";
import Link from "next/link";
import { resendConfirmation, signInCustomer, type AuthState } from "../actions";
import { SocialButtons } from "../social-buttons";

function ResendForm({ email, next }: { email: string; next: string }) {
  const [state, action, pending] = useActionState(resendConfirmation, { error: null } as AuthState);
  if (state.message === "resent") {
    return <p className="auth-note">A new confirmation link is on its way to {email}.</p>;
  }
  return (
    <form action={action} className="auth-note">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      Didn&rsquo;t get it?{" "}
      <button type="submit" className="auth-link-btn" disabled={pending}>
        {pending ? "Sending…" : "Resend the email"}
      </button>
      {state.error && <span className="auth-note__error"> {state.error}</span>}
    </form>
  );
}

export default function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; confirmed?: string; error?: string }>;
}) {
  const { next: nextParam, confirmed, error: callbackError } = use(searchParams);
  const next = nextParam?.startsWith("/") ? nextParam : "/account";
  const [state, formAction, pending] = useActionState(signInCustomer, { error: null } as AuthState);

  return (
    <div className="auth-page">
      <div className="order-form auth-card">
        <h1 className="order-form__title">Sign in</h1>
        <p className="order-form__lede">
          New here?{" "}
          <Link href={`/account/signup${nextParam ? `?next=${encodeURIComponent(next)}` : ""}`}>Create an account</Link>{" "}
          — it&rsquo;s needed to request a piece or send us a message.
        </p>

        {confirmed && (
          <p className="auth-success" role="status">
            Your email is confirmed — sign in to continue.
          </p>
        )}
        {callbackError && (
          <p className="order-form__error" role="alert">
            Sign-in was cancelled or failed ({callbackError}). Please try again.
          </p>
        )}

        <SocialButtons next={next} />

        <form className="auth-form" action={formAction}>
          <input type="hidden" name="next" value={next} />
          <label className="order-form__field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" required defaultValue={state.email} />
          </label>
          <label className="order-form__field">
            <span>Password</span>
            <input type="password" name="password" autoComplete="current-password" required />
          </label>

          {state.error && (
            <p className="order-form__error" role="alert">
              {state.error}
            </p>
          )}

          <button className="cta-solid" type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {state.message === "unconfirmed" && state.email && <ResendForm email={state.email} next={next} />}
      </div>
    </div>
  );
}
