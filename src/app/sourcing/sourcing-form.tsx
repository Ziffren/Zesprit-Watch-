"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { CustomerProfile } from "@/lib/customer";
import { BOX_PAPERS, CONDITIONS, CONTACT_METHODS, MAX_REFERENCE_LINKS } from "@/lib/sourcing";
import { submitSourcing, type SourcingState } from "./actions";
import { useKeepForm } from "@/lib/use-keep-form";

export function SourcingForm({ profile, brands }: { profile: CustomerProfile; brands: string[] }) {
  const [state, action, pending] = useActionState(submitSourcing, { status: "idle" } as SourcingState);
  const [links, setLinks] = useState<string[]>([""]);
  const keep = useKeepForm(action);

  if (state.status === "success") {
    return (
      <div className="sourcing-card sourcing-card--done" role="status">
        <p className="sourcing-card__done-title">Request received.</p>
        <p>
          We&rsquo;ll start looking and reach you through your preferred contact method — usually within a couple
          of business days with a first update. You can follow it on <Link href="/account">your account</Link>.
        </p>
        <button type="button" className="sourcing-link-btn" onClick={() => window.location.reload()}>
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form className="sourcing-card" action={action} onSubmit={keep}>
      <fieldset className="sourcing-fieldset">
        <legend>The watch</legend>
        <label className="order-form__field">
          <span>Brand</span>
          <input name="brand" list="sourcing-brands" required placeholder="e.g. Grand Seiko" autoComplete="off" />
          <datalist id="sourcing-brands">
            {brands.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </label>
        <label className="order-form__field">
          <span>Model or reference number</span>
          <input name="model" placeholder="e.g. SBGA011 “Snowflake”" />
        </label>
        <label className="order-form__field">
          <span>Anything else we should know (optional)</span>
          <textarea name="details" rows={3} placeholder="Dial colour, case size, year, strap or bracelet…" />
        </label>
      </fieldset>

      <fieldset className="sourcing-fieldset">
        <legend>Budget (USD)</legend>
        <div className="sourcing-row">
          <label className="order-form__field">
            <span>From</span>
            <input name="minPrice" inputMode="decimal" placeholder="2,000" />
          </label>
          <label className="order-form__field">
            <span>To</span>
            <input name="maxPrice" inputMode="decimal" placeholder="4,500" />
          </label>
        </div>
        <p className="sourcing-hint">Leave blank if you&rsquo;re flexible.</p>
      </fieldset>

      <fieldset className="sourcing-fieldset">
        <legend>Condition &amp; set</legend>
        <div className="sourcing-row">
          <label className="order-form__field">
            <span>Condition</span>
            <select name="condition" defaultValue="ANY">
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="order-form__field">
            <span>Box &amp; papers</span>
            <select name="boxPapers" defaultValue="ANY">
              {BOX_PAPERS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="sourcing-fieldset">
        <legend>Reference links (optional)</legend>
        <p className="sourcing-hint">A listing, photo or article showing the exact watch you have in mind.</p>
        {links.map((value, i) => (
          <div className="sourcing-link-row" key={i}>
            <input
              className="sourcing-link-input"
              name="referenceLinks"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={value}
              aria-label={`Reference link ${i + 1}`}
              onChange={(e) => setLinks((prev) => prev.map((l, j) => (j === i ? e.target.value : l)))}
            />
            {links.length > 1 && (
              <button
                type="button"
                className="sourcing-remove"
                aria-label={`Remove link ${i + 1}`}
                onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {links.length < MAX_REFERENCE_LINKS && (
          <button type="button" className="sourcing-link-btn" onClick={() => setLinks((prev) => [...prev, ""])}>
            + Add another link
          </button>
        )}
      </fieldset>

      <fieldset className="sourcing-fieldset">
        <legend>How to reach you</legend>
        <div className="sourcing-row">
          <label className="order-form__field">
            <span>Name</span>
            <input name="contactName" required autoComplete="name" defaultValue={profile.name ?? ""} />
          </label>
          <label className="order-form__field">
            <span>Email</span>
            <input name="contactEmail" type="email" required autoComplete="email" defaultValue={profile.email} />
          </label>
        </div>
        <div className="sourcing-row">
          <label className="order-form__field">
            <span>Phone / LINE / WhatsApp</span>
            <input name="contactPhone" autoComplete="tel" defaultValue={profile.phone ?? ""} />
          </label>
          <label className="order-form__field">
            <span>Preferred contact</span>
            <select name="contactMethod" defaultValue="EMAIL">
              {CONTACT_METHODS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      {state.status === "error" && (
        <p className="order-form__error" role="alert">
          {state.message}
        </p>
      )}

      <button className="cta-solid sourcing-submit" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send sourcing request"}
      </button>
      <p className="sourcing-hint">No payment is taken — we&rsquo;ll come back to you with options first.</p>
    </form>
  );
}
