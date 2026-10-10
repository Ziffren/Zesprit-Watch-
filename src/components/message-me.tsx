"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageForm, type MessageProfile } from "./message-form";

// Header "Message Me": opens a dialog on any page. Looks up the signed-in
// customer (if any) when opened so their details are filled in; guests type
// theirs. The page itself stays statically cached.
export function MessageMe() {
  const ref = useRef<HTMLDialogElement>(null);
  const [profile, setProfile] = useState<MessageProfile | null | undefined>(undefined);
  const [session, setSession] = useState(0); // remount the form on each open

  async function open() {
    setSession((n) => n + 1);
    ref.current?.showModal();
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setProfile(null);
      const { data } = await supabase
        .from("customer_profiles")
        .select("name, email, phone")
        .eq("userId", user.id)
        .maybeSingle();
      setProfile(data ?? { name: (user.user_metadata?.name as string) ?? null, email: user.email ?? "", phone: null });
    } catch {
      setProfile(null);
    }
  }

  return (
    <>
      <button type="button" className="message-me-btn" onClick={open}>
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <path d="M2.25 3.25h11.5v7.5H6.5l-3 2.5v-2.5H2.25z" strokeLinejoin="round" />
        </svg>
        Message Me
      </button>
      <dialog
        ref={ref}
        className="buy-dialog"
        aria-label="Message me"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="buy-dialog__body">
          <button type="button" className="buy-dialog__close" aria-label="Close" onClick={() => ref.current?.close()}>
            ×
          </button>
          {profile === undefined ? (
            <p className="message-form__loading" aria-live="polite">
              Loading…
            </p>
          ) : (
            <MessageForm key={session} profile={profile} />
          )}
        </div>
      </dialog>
    </>
  );
}
