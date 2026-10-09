"use client";

import { use, useActionState } from "react";
import Link from "next/link";
import { resendConfirmation, signUpCustomer, type AuthState } from "../actions";
import { SocialButtons } from "../social-buttons";

function CheckEmail({ email, next }: { email: string; next: string }) {
  const [state, action, pending] = useActionState(resendConfirmation, { error: null } as AuthState);
  return (
    <div className="auth-page">
      <div className="order-form__success auth-card auth-card--center">
        <svg className="auth-mail-icon" viewBox="0 0 48 48" aria-hidden="true">
          <rect x="6" y="11" width="36" height="26" rx="3" />
          <path d="m7 13 17 13 17-13" />
        </svg>
        <p className="order-form__success-title">Check your inbox</p>
        <p>
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account —
          you&rsquo;ll be signed in and brought straight back.
        </p>
        <p className="auth-note">Can&rsquo;t find it? Check spam or promotions.</p>
        {state.message === "resent" ? (
          <p className="auth-note">A new link is on its way.</p>
        ) : (
          <form action={action} className="auth-note">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={next} />
            <button type="submit" className="auth-link-btn" disabled={pending}>
              {pending ? "Sending…" : "Resend the email"}
            </button>
            {state.error && <span className="auth-note__error"> {state.error}</span>}
          </form>
        )}
        <p className="auth-note">
          Wrong address? <Link href="/account/signup">Start again</Link>
        </p>
      </div>
    </div>
  );
}

export default function AccountSignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: nextParam } = use(searchParams);
  const next = nextParam?.startsWith("/") ? nextParam : "/account";
  const [state, formAction, pending] = useActionState(signUpCustomer, { error: null } as AuthState);

  if (state.message === "confirm" && state.email) return <CheckEmail email={state.email} next={next} />;

  return (
    <div className="auth-page">
      <div className="order-form auth-card">
        <h1 className="order-form__title">Create an account</h1>
        <p className="order-form__lede">
          Already have one?{" "}
          <Link href={`/account/login${nextParam ? `?next=${encodeURIComponent(next)}` : ""}`}>Sign in</Link>.
        </p>

        <SocialButtons next={next} />

        <form className="auth-form" action={formAction}>
          <input type="hidden" name="next" value={next} />
          <label className="order-form__field">
            <span>Full name</span>
            <input type="text" name="name" autoComplete="name" required />
          </label>
          <label className="order-form__field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label className="order-form__field">
            <span>Phone</span>
            <input type="tel" name="phone" autoComplete="tel" required placeholder="+81 90 1234 5678" />
          </label>
          <label className="order-form__field">
            <span>Address</span>
            <textarea
              name="address"
              autoComplete="street-address"
              required
              rows={3}
              placeholder="Street, city, postal code, country"
            />
          </label>
          <label className="order-form__field">
            <span>Password</span>
            <input type="password" name="password" autoComplete="new-password" required minLength={8} />
            <span className="auth-field-hint">At least 8 characters.</span>
          </label>

          {state.error && (
            <p className="order-form__error" role="alert">
              {state.error}
            </p>
          )}

          <button className="cta-solid" type="submit" disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </button>
          <p className="auth-note">We&rsquo;ll email you a link to confirm the address before your account is active.</p>
        </form>
      </div>
    </div>
  );
}
