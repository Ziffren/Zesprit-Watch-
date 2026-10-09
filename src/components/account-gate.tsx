import Link from "next/link";
import type { CustomerState } from "@/lib/customer";

// Shown in place of a form that needs an account (request a piece, send a
// message). Browsing stays open to everyone; these actions don't.
export function AccountGate({
  customer,
  next,
  action,
}: {
  customer: Exclude<CustomerState, { status: "ready" }>;
  next: string;
  action: string; // e.g. "request this piece"
}) {
  const q = `?next=${encodeURIComponent(next)}`;
  if (customer.status === "incomplete") {
    return (
      <div className="account-gate">
        <p className="account-gate__title">Almost there</p>
        <p>Add your phone and address to {action} — it takes a moment.</p>
        <Link className="cta-solid" href={`/account/complete${q}`}>
          Complete your details
        </Link>
      </div>
    );
  }
  return (
    <div className="account-gate">
      <p className="account-gate__title">Sign in to {action}</p>
      <p>An account lets us follow up with you directly and keeps your requests in one place.</p>
      <div className="account-gate__actions">
        <Link className="cta-solid" href={`/account/login${q}`}>
          Sign in
        </Link>
        <Link className="account-gate__secondary" href={`/account/signup${q}`}>
          Create an account
        </Link>
      </div>
    </div>
  );
}

// "Requesting as …" line above a signed-in form.
export function SignedInAs({ name, email, phone }: { name: string | null; email: string; phone: string | null }) {
  return (
    <p className="signed-in-as">
      Sending as <strong>{name}</strong> · {email}
      {phone ? ` · ${phone}` : ""} · <Link href="/account/complete?edit=1">Edit</Link>
    </p>
  );
}
