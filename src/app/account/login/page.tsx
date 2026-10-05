"use client";

import { use, useActionState } from "react";
import Link from "next/link";
import { signInCustomer, type AuthState } from "../actions";

export default function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = use(searchParams);
  const initialState: AuthState = { error: null };
  const [state, formAction, pending] = useActionState(signInCustomer, initialState);

  return (
    <div className="auth-page">
      <form className="order-form auth-card" action={formAction}>
        <input type="hidden" name="next" value={next ?? "/account"} />
        <h1 className="order-form__title">Sign in</h1>
        <p className="order-form__lede">
          New here?{" "}
          <Link href={`/account/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
            Create an account
          </Link>
          .
        </p>

        <label className="order-form__field">
          <span>Email</span>
          <input type="email" name="email" autoComplete="email" required />
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
    </div>
  );
}
