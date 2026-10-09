import { createClient } from "@/lib/supabase/server";

export type CustomerProfile = {
  userId: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
};

export type CustomerState =
  | { status: "signed-out" }
  | { status: "incomplete"; profile: CustomerProfile }
  | { status: "ready"; profile: CustomerProfile };

// A profile is complete once the basics are in — required before a
// customer can request a piece or send a message (Google/Facebook sign-ins
// arrive with only a name and email).
export function isProfileComplete(p: Pick<CustomerProfile, "name" | "phone" | "address">): boolean {
  return Boolean(p.name?.trim() && p.phone?.trim() && p.address?.trim());
}

export async function getCustomer(): Promise<CustomerState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed-out" };

  const { data } = await supabase
    .from("customer_profiles")
    .select("userId, email, name, phone, address")
    .eq("userId", user.id)
    .maybeSingle();

  const profile: CustomerProfile = data ?? {
    userId: user.id,
    email: user.email ?? "",
    name: null,
    phone: null,
    address: null,
  };
  return isProfileComplete(profile) ? { status: "ready", profile } : { status: "incomplete", profile };
}

// Only same-site paths are allowed as post-login destinations.
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
