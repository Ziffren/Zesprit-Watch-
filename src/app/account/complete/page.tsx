import { redirect } from "next/navigation";
import { getCustomer, safeNext } from "@/lib/customer";
import { CompleteForm } from "./complete-form";

export const dynamic = "force-dynamic";

// Required step after Google/Facebook sign-in (they only give us a name and
// email); also the "Edit details" page from /account.
export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; edit?: string }>;
}) {
  const { next: nextParam, edit } = await searchParams;
  const next = safeNext(nextParam, "/account");
  const customer = await getCustomer();
  if (customer.status === "signed-out") redirect(`/account/login?next=${encodeURIComponent("/account/complete")}`);

  const editing = edit === "1" || customer.status === "ready";
  return <CompleteForm profile={customer.profile} next={next} editing={editing} />;
}
