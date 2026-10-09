"use client";

import { useActionState } from "react";
import { useKeepForm } from "@/lib/use-keep-form";
import { sendPieceMessage, type PieceMessageState } from "./actions";

export function PieceMessageForm({ watchId, email }: { watchId: string; email: string }) {
  const action = sendPieceMessage.bind(null, watchId);
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as PieceMessageState);
  const keep = useKeepForm(formAction);

  if (state.status === "success") {
    return <p className="accordion-note">Thanks — we&rsquo;ll reply to {email} shortly.</p>;
  }
  return (
    <form className="piece-message" action={formAction} onSubmit={keep}>
      <textarea name="message" rows={3} required placeholder="Ask about condition, service history, sizing…" aria-label="Your question" />
      {state.status === "error" && (
        <p className="order-form__error" role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" className="buy-btn buy-btn--small" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
