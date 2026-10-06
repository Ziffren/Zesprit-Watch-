import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Fire-and-forget pageview logging for the admin Analytics dashboard
// (/admin/analytics). Never blocks or breaks the page it's called from —
// any failure here is swallowed, both by the caller (page-tracker.tsx) and
// by returning 204 regardless of outcome.
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) return new NextResponse(null, { status: 204 });

  try {
    const body = await request.json();
    const path = typeof body.path === "string" ? body.path.slice(0, 2048) : null;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null;
    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 2048) || null : null;
    if (!path || !sessionId) return new NextResponse(null, { status: 204 });

    const country = request.headers.get("x-vercel-ip-country");
    const region = request.headers.get("x-vercel-ip-country-region");
    const cityRaw = request.headers.get("x-vercel-ip-city");
    const city = cityRaw ? decodeURIComponent(cityRaw) : null;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("page_views").insert({
      path,
      sessionId,
      customerId: user?.id ?? null,
      country,
      region,
      city,
      referrer,
    });
  } catch {
    // Analytics is best-effort — never surface this to the visitor.
  }

  return new NextResponse(null, { status: 204 });
}
