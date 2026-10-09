"use client";

import { useActionState } from "react";
import { SignedInAs } from "@/components/account-gate";
import type { CustomerProfile } from "@/lib/customer";
import { depositAmount, type ShopSettings } from "@/lib/deposits";
import { useKeepForm } from "@/lib/use-keep-form";
import { submitDeposit, type SubmitDepositState } from "./actions";

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function DepositForm({
  watchId,
  priceCents,
  settings,
  profile,
}: {
  watchId: string;
  priceCents: number;
  settings: ShopSettings;
  profile: CustomerProfile;
}) {
  const action = submitDeposit.bind(null, watchId);
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as SubmitDepositState);
  const keep = useKeepForm(formAction);
  const amount = depositAmount(priceCents, settings.depositPercent);

  if (state.status === "success") {
    return (
      <div className="order-form__success">
        <p className="order-form__success-title">Deposit request received.</p>
        <p>
          Your deposit is <strong>{money(state.amountCents ?? amount)}</strong>. We&rsquo;ve emailed the payment details to{" "}
          {profile.email}.
        </p>
        {state.paymentInstructions && <p className="deposit-instructions">{state.paymentInstructions}</p>}
        <p>
          As soon as it arrives we&rsquo;ll put the watch on hold for you for {state.holdDays ?? settings.holdDays} days and
          let you know. Follow it under <a href="/account">your account</a>.
        </p>
      </div>
    );
  }

  return (
    <form className="order-form" action={formAction} onSubmit={keep}>
      <h2 className="order-form__title">Hold it with a deposit</h2>
      <div className="deposit-summary">
        <div>
          <span className="deposit-summary__label">Deposit ({settings.depositPercent}%)</span>
          <span className="deposit-summary__amount">{money(amount)}</span>
        </div>
        <div>
          <span className="deposit-summary__label">Balance later</span>
          <span>{money(priceCents - amount)}</span>
        </div>
      </div>
      <ol className="deposit-steps">
        <li>Send the request — we email you how to pay (bank transfer or similar).</li>
        <li>Once your deposit arrives, the watch is held for you for {settings.holdDays} days.</li>
        <li>Pay the balance and we ship it to you.</li>
      </ol>
      <SignedInAs name={profile.name} email={profile.email} phone={profile.phone} />
      <label className="order-form__field">
        <span>Message (optional)</span>
        <textarea name="message" rows={2} placeholder="Anything we should know?" />
      </label>
      {state.status === "error" && (
        <p className="order-form__error" role="alert">
          {state.message}
        </p>
      )}
      <button className="cta-solid" type="submit" disabled={pending}>
        {pending ? "Sending…" : `Request to hold · ${money(amount)} deposit`}
      </button>
    </form>
  );
}
