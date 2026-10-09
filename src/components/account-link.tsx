"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Header account entry. Reads the session in the browser so the storefront
// pages stay statically cached (no per-visitor server render).
export function AccountLink() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const show = (meta: Record<string, unknown> | undefined, email: string | undefined, signedIn: boolean) => {
      if (!signedIn) return setLabel(null);
      const name = (meta?.name ?? meta?.full_name ?? email ?? "Account") as string;
      setLabel(name.split(" ")[0]);
    };
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      show(u?.user_metadata, u?.email, Boolean(u));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      show(session?.user.user_metadata, session?.user.email, Boolean(session)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Link className="icon-link account-link" href={label ? "/account" : "/account/login"} aria-label={label ? `Your account (${label})` : "Sign in"}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="account-link__label">{label ?? "Sign in"}</span>
    </Link>
  );
}
