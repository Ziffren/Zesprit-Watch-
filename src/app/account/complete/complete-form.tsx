"use client";

import { useActionState } from "react";
import type { CustomerProfile } from "@/lib/customer";
import { completeProfile, type AuthState } from "../actions";

export function CompleteForm({ profile, next, editing }: { profile: CustomerProfile; next: string; editing: boolean }) {
  const [state, action, pending] = useActionState(completeProfile, { error: null } as AuthState);

  return (
    <div className="auth-page">
      <form className="order-form auth-card" action={action}>
        <h1 className="order-form__title">{editing ? "Your details" : "One last step"}</h1>
        <p className="order-form__lede">
          {editing
            ? "Kept on file so we can reach you about the pieces you request."
            : "Add your phone and address so we can reach you about the pieces you request."}
        </p>
        <input type="hidden" name="next" value={next} />

        <label className="order-form__field">
          <span>Email</span>
          <input type="email" value={profile.email} readOnly disabled />
        </label>
        <label className="order-form__field">
          <span>Full name</span>
          <input type="text" name="name" autoComplete="name" required defaultValue={profile.name ?? ""} />
        </label>
        <label className="order-form__field">
          <span>Phone</span>
          <input type="tel" name="phone" autoComplete="tel" required defaultValue={profile.phone ?? ""} placeholder="+81 90 1234 5678" />
        </label>
        <label className="order-form__field">
          <span>Address</span>
          <textarea
            name="address"
            autoComplete="street-address"
            required
            rows={3}
            defaultValue={profile.address ?? ""}
            placeholder="Street, city, postal code, country"
          />
        </label>

        {state.error && (
          <p className="order-form__error" role="alert">
            {state.error}
          </p>
        )}

        <button className="cta-solid" type="submit" disabled={pending}>
          {pending ? "Saving…" : editing ? "Save details" : "Continue"}
        </button>
      </form>
    </div>
  );
}
