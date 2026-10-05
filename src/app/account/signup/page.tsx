"use client";

import { use, useActionState } from "react";
import Link from "next/link";
import { signUpCustomer, type AuthState } from "../actions";

export default function AccountSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = use(searchParams);
  const initialState: AuthState = { error: null };
  const [state, formAction, pending] = useActionState(signUpCustomer, initialState);

  if (state.message) {
    return (
      <div className="auth-page">
        <div className="order-form__success auth-card">
          <p className="order-form__success-title">{state.message}</p>
          <p>
            <Link href="/account/login">Go to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="order-form auth-card" action={formAction}>
        <h1 className="order-form__title">Create an account</h1>
        <p className="order-form__lede">
          Already have one?{" "}
          <Link href={`/account/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
            Sign in
          </Link>
          .
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
          <span>Password</span>
          <input type="password" name="password" autoComplete="new-password" required minLength={8} />
        </label>

        {state.error && (
          <p className="order-form__error" role="alert">
            {state.error}
          </p>
        )}

        <button className="cta-solid" type="submit" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
