"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/customer";

export type AuthState = { error: string | null; message?: string; email?: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\-\s\d]{7,20}$/;

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function readDetails(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
  };
}

function checkDetails(d: { name: string; phone: string; address: string }): string | null {
  if (!d.name) return "Enter your full name.";
  if (!d.phone) return "Enter a phone number.";
  if (!phonePattern.test(d.phone)) return "Enter a valid phone number (digits, spaces, + and - only).";
  if (d.address.length < 6) return "Enter your full address.";
  return null;
}

// Email sign-up. Supabase sends a confirmation link; the account can't sign
// in until the customer clicks it (Auth → "Confirm email" must be on).
export async function signUpCustomer(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const details = readDetails(formData);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""), "/account");

  const problem = checkDetails(details);
  if (problem) return { error: problem };
  if (!emailPattern.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: details,
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    if (/already|registered/i.test(error.message)) return { error: "An account with this email already exists — sign in instead." };
    if (/rate limit/i.test(error.message)) return { error: "Too many sign-up emails just now — please try again in a few minutes." };
    return { error: "Couldn't create your account — please try again." };
  }

  // Supabase returns a user with no identities when the email is already
  // registered (it doesn't reveal that directly, to prevent enumeration).
  if (data.user && data.user.identities?.length === 0) {
    return { error: "An account with this email already exists — sign in instead." };
  }

  if (!data.session) {
    return { error: null, message: "confirm", email };
  }
  redirect(next);
}

export async function signInCustomer(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""), "/account");

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (/not confirmed/i.test(error.message)) {
      return { error: "Please confirm your email first — check your inbox for our link.", message: "unconfirmed", email };
    }
    return { error: "That email or password wasn't recognized." };
  }

  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("name, phone, address")
    .eq("userId", data.user.id)
    .maybeSingle();
  if (!profile?.name || !profile.phone || !profile.address) {
    redirect(`/account/complete?next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function resendConfirmation(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(String(formData.get("next") ?? ""), "/account");
  if (!emailPattern.test(email)) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    return {
      error: /rate limit|seconds/i.test(error.message)
        ? "Please wait a minute before asking for another email."
        : "Couldn't resend the email — please try again.",
      email,
    };
  }
  return { error: null, message: "resent", email };
}

// "Complete your details" — required after Google/Facebook sign-in, and
// also used as "Edit details" from the account page.
export async function completeProfile(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const details = readDetails(formData);
  const next = safeNext(String(formData.get("next") ?? ""), "/account");
  const problem = checkDetails(details);
  if (problem) return { error: problem };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(next)}`);

  // Update the profile row; older accounts may not have one yet, so create
  // it if the update matched nothing — never report success for a no-op.
  const { data: updated, error } = await supabase
    .from("customer_profiles")
    .update(details)
    .eq("userId", user.id)
    .select("userId");
  if (error) return { error: "Couldn't save your details — please try again." };
  if (!updated || updated.length === 0) {
    const { error: insertError } = await supabase
      .from("customer_profiles")
      .insert({ userId: user.id, email: user.email ?? "", ...details });
    if (insertError) return { error: "Couldn't save your details — please try again." };
  }

  revalidatePath("/account");
  redirect(next);
}

export async function signOutCustomer() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
