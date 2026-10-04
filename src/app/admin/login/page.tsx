"use client";

import { use, useActionState } from "react";
import { signIn, type SignInState } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = use(searchParams);
  const initialState: SignInState = { error: null };
  const [state, formAction, pending] = useActionState(signIn, initialState);

  const notice =
    resolvedSearchParams.error === "not-configured"
      ? "Supabase isn't configured yet — add your project keys to .env.local."
      : null;

  return (
    <div className="admin-auth">
      <form className="admin-auth__card" action={formAction}>
        <p className="admin-auth__wordmark">Z&rsquo;esprit Watch</p>
        <h1 className="admin-auth__title">Admin</h1>
        <p className="admin-auth__lede">Sign in to manage products and collections.</p>

        <label className="admin-field">
          <span>Email</span>
          <input type="email" name="email" autoComplete="email" required />
        </label>

        <label className="admin-field">
          <span>Password</span>
          <input type="password" name="password" autoComplete="current-password" required />
        </label>

        {(state.error || notice) && (
          <p className="admin-auth__error" role="alert">
            {state.error ?? notice}
          </p>
        )}

        <button className="admin-btn admin-btn--primary" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
