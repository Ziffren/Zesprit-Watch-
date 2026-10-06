import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Classifies the User-Agent into a coarse, non-identifying category for
// aggregate device-mix stats. The raw header is read here and discarded —
// never stored, never logged. Deliberately not a full UA parse (no
// browser/OS/version) — just enough to answer "mobile or desktop."
function classifyDevice(userAgent: string | null): "Mobile" | "Tablet" | "Desktop" | null {
  if (!userAgent) return null;
  if (/iPad|Android(?!.*Mobile)/i.test(userAgent)) return "Tablet";
  if (/Mobi|iPhone|iPod|Android/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

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
    const deviceType = classifyDevice(request.headers.get("user-agent"));

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
      deviceType,
      referrer,
    });
  } catch {
    // Analytics is best-effort — never surface this to the visitor.
  }

  return new NextResponse(null, { status: 204 });
}
