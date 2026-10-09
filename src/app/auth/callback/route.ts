import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isProfileComplete, safeNext } from "@/lib/customer";

// Landing point for Google/Facebook sign-in and for the link in the
// "confirm your email" message. Exchanges the one-time code for a session,
// then sends the customer on — via "complete your details" first if their
// profile is still missing phone/address (always the case after a first
// Google/Facebook sign-in).
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"), "/account");
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  const to = (path: string, params: Record<string, string> = {}) => {
    const dest = new URL(path, url.origin);
    for (const [k, v] of Object.entries(params)) dest.searchParams.set(k, v);
    return NextResponse.redirect(dest);
  };

  if (providerError) return to("/account/login", { error: providerError, next });
  if (!code) return to("/account/login", { next });

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // The confirmation link was opened in a different browser/device than
    // the one that signed up (the one-time code is tied to that browser).
    // Supabase has still confirmed the email — the customer just signs in.
    return to("/account/login", { confirmed: "1", next });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("name, phone, address")
    .eq("userId", user!.id)
    .maybeSingle();

  if (!profile || !isProfileComplete(profile)) return to("/account/complete", { next });
  return to(next);
}
