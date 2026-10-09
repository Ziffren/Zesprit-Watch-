"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

type Provider = "google" | "facebook";

// One-tap sign-in / sign-up. New accounts land on "complete your details"
// (phone + address) before they can request a piece — see /auth/callback.
export function SocialButtons({ next }: { next: string }) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Only offer providers that are switched on in Supabase (Auth → Providers);
  // enabling one there makes its button appear with no redeploy.
  const [enabled, setEnabled] = useState<Record<Provider, boolean> | null>(
    null,
  );

  useEffect(() => {
    fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey! },
    })
      .then((r) => r.json())
      .then((s) =>
        setEnabled({
          google: Boolean(s?.external?.google),
          facebook: Boolean(s?.external?.facebook),
        }),
      )
      .catch(() => setEnabled({ google: false, facebook: false }));
  }, []);

  async function go(provider: Provider) {
    setBusy(provider);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setBusy(null);
      setError(
        /not enabled|unsupported provider/i.test(error.message)
          ? `${provider === "google" ? "Google" : "Facebook"} sign-in isn't switched on yet — please use email for now.`
          : "Couldn't start sign-in — please try again.",
      );
    }
  }

  if (!enabled || (!enabled.google && !enabled.facebook)) return null;

  return (
    <div className="social-auth">
      {enabled.google && (
        <button
          type="button"
          className="social-auth__btn"
          onClick={() => go("google")}
          disabled={busy !== null}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z"
            />
            <path
              fill="#34A853"
              d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z"
            />
            <path
              fill="#FBBC05"
              d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z"
            />
          </svg>
          {busy === "google" ? "Opening Google…" : "Continue with Google"}
        </button>
      )}
      {enabled.facebook && (
        <button
          type="button"
          className="social-auth__btn"
          onClick={() => go("facebook")}
          disabled={busy !== null}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="#1877F2"
              d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12Z"
            />
          </svg>
          {busy === "facebook" ? "Opening Facebook…" : "Continue with Facebook"}
        </button>
      )}
      {error && (
        <p className="order-form__error" role="alert">
          {error}
        </p>
      )}
      <p className="social-auth__or" aria-hidden="true">
        <span>or with email</span>
      </p>
    </div>
  );
}
