"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { saveCollection, type SaveCollectionState } from "./actions";

// Client wrapper so save errors (duplicate slug, missing condition…) show
// inline on the form instead of throwing to the error page.
export function CollectionFormShell({ children }: { children: ReactNode }) {
  const [state, formAction] = useActionState<SaveCollectionState, FormData>(saveCollection, {
    error: null,
  });

  return (
    <form className="admin-form" action={formAction}>
      {state.error && (
        <p className="admin-form__error" role="alert">
          {state.error}
        </p>
      )}
      {children}
    </form>
  );
}

// Disabled with a "Saving…" label while the action runs, so a second click
// can't submit the same new collection twice.
export function SaveCollectionButton() {
  const { pending } = useFormStatus();
  return (
    <button className="admin-btn admin-btn--primary" type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save collection"}
    </button>
  );
}
