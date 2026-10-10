"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { CartButton } from "./cart-button";

type Gate = { kind: "ready" } | { kind: "signed-out" } | { kind: "incomplete" };

// Shopify-style buy area: two clear buttons. Signed-in customers open a small
// dialog to confirm (the request / deposit forms live there); everyone else
// is sent to sign in (or finish their details) and brought straight back.
export function BuyButtons({
  watchId,
  gate,
  next,
  buyForm,
  depositForm,
  depositLabel,
}: {
  watchId: string;
  gate: Gate;
  next: string;
  buyForm: ReactNode;
  depositForm: ReactNode | null;
  depositLabel: string | null;
}) {
  const buyRef = useRef<HTMLDialogElement>(null);
  const depRef = useRef<HTMLDialogElement>(null);
  const q = `?next=${encodeURIComponent(next)}`;

  if (gate.kind !== "ready") {
    const href = gate.kind === "signed-out" ? `/account/login${q}` : `/account/complete${q}`;
    return (
      <div className="buy-buttons">
        <Link className="buy-btn buy-btn--primary" href={href}>
          {gate.kind === "signed-out" ? "Sign in to buy" : "Complete your details to buy"}
        </Link>
        {depositLabel && (
          <Link className="buy-btn" href={href}>
            Hold with a deposit · {depositLabel}
          </Link>
        )}
        <p className="buy-note">
          {gate.kind === "signed-out" ? (
            <>
              New here? <Link href={`/account/signup${q}`}>Create an account</Link> — it takes a minute.
            </>
          ) : (
            "We need your phone and address to arrange the sale."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="buy-buttons">
      <CartButton watchId={watchId} />
      <button type="button" className="buy-btn" onClick={() => buyRef.current?.showModal()}>
        Buy it now
      </button>
      {depositForm && depositLabel && (
        <button type="button" className="buy-btn" onClick={() => depRef.current?.showModal()}>
          Hold with a deposit · {depositLabel}
        </button>
      )}
      <p className="buy-note">No payment is taken online — we confirm everything with you first.</p>

      <BuyDialog dialogRef={buyRef} title="Buy it now">
        {buyForm}
      </BuyDialog>
      {depositForm && (
        <BuyDialog dialogRef={depRef} title="Hold with a deposit">
          {depositForm}
        </BuyDialog>
      )}
    </div>
  );
}

function BuyDialog({
  dialogRef,
  title,
  children,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  children: ReactNode;
}) {
  return (
    <dialog
      ref={dialogRef}
      className="buy-dialog"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="buy-dialog__body">
        <button type="button" className="buy-dialog__close" aria-label="Close" onClick={() => dialogRef.current?.close()}>
          ×
        </button>
        {children}
      </div>
    </dialog>
  );
}
