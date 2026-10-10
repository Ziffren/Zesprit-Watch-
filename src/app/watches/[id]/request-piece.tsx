"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { SignedInAs } from "@/components/account-gate";
import type { CustomerProfile } from "@/lib/customer";
import { BOX_PAPERS, CONDITIONS } from "@/lib/sourcing";
import { useKeepForm } from "@/lib/use-keep-form";
import { submitSourcing, type SourcingState } from "@/app/sourcing/actions";

// Sold piece → "Request this piece": a sourcing request pre-filled with this
// watch (brand, model, link back to the page), so the owner can look for
// another one. Lands in Admin → Sourcing.
export function RequestPiece({
  gate,
  next,
  brand,
  model,
  pageUrl,
  profile,
}: {
  gate: "ready" | "signed-out" | "incomplete";
  next: string;
  brand: string;
  model: string;
  pageUrl: string;
  profile: CustomerProfile | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(submitSourcing, { status: "idle" } as SourcingState);
  const keep = useKeepForm(action);
  const q = `?next=${encodeURIComponent(next)}`;

  return (
    <div className="sold-panel">
      <p className="sold-panel__title">This piece has found its home</p>
      <p>Looking for one like it? We can search the Japanese market for another example and let you know what we find.</p>
      {gate === "ready" && profile ? (
        <button type="button" className="buy-btn buy-btn--primary" onClick={() => ref.current?.showModal()}>
          Request this piece
        </button>
      ) : (
        <Link className="buy-btn buy-btn--primary" href={`/account/${gate === "signed-out" ? "login" : "complete"}${q}`}>
          {gate === "signed-out" ? "Sign in to request this piece" : "Complete your details to request"}
        </Link>
      )}

      {profile && (
        <dialog
          ref={ref}
          className="buy-dialog"
          aria-label="Request this piece"
          onClick={(e) => {
            if (e.target === e.currentTarget) e.currentTarget.close();
          }}
        >
          <div className="buy-dialog__body">
            <button type="button" className="buy-dialog__close" aria-label="Close" onClick={() => ref.current?.close()}>
              ×
            </button>
            {state.status === "success" ? (
              <div className="order-form__success">
                <p className="order-form__success-title">Request received.</p>
                <p>
                  We&rsquo;ll start looking for a {brand} {model} and reach you at {profile.email}. You can follow it on{" "}
                  <a href="/account">your account</a>.
                </p>
              </div>
            ) : (
              <form className="order-form" action={action} onSubmit={keep}>
                <h2 className="order-form__title">Request this piece</h2>
                <p className="order-form__lede">
                  {brand} · {model}
                </p>
                <input type="hidden" name="brand" value={brand} />
                <input type="hidden" name="model" value={model} />
                <input type="hidden" name="referenceLinks" value={pageUrl} />
                <input type="hidden" name="contactName" value={profile.name ?? ""} />
                <input type="hidden" name="contactEmail" value={profile.email} />
                <input type="hidden" name="contactPhone" value={profile.phone ?? ""} />
                <input type="hidden" name="contactMethod" value="EMAIL" />
                <div className="sourcing-row">
                  <label className="order-form__field">
                    <span>Budget from (USD)</span>
                    <input name="minPrice" inputMode="decimal" placeholder="Optional" />
                  </label>
                  <label className="order-form__field">
                    <span>Budget to (USD)</span>
                    <input name="maxPrice" inputMode="decimal" placeholder="Optional" />
                  </label>
                </div>
                <div className="sourcing-row">
                  <label className="order-form__field">
                    <span>Condition</span>
                    <select name="condition" defaultValue="ANY">
                      {CONDITIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label.split(" —")[0]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="order-form__field">
                    <span>Box &amp; papers</span>
                    <select name="boxPapers" defaultValue="ANY">
                      {BOX_PAPERS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label.split(" —")[0]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="order-form__field">
                  <span>Anything else (optional)</span>
                  <textarea name="details" rows={2} placeholder="Dial, year, strap…" />
                </label>
                <SignedInAs name={profile.name} email={profile.email} phone={profile.phone} />
                {state.status === "error" && (
                  <p className="order-form__error" role="alert">
                    {state.message}
                  </p>
                )}
                <button className="cta-solid" type="submit" disabled={pending}>
                  {pending ? "Sending…" : "Send request"}
                </button>
              </form>
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
