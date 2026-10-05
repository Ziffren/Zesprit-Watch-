import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

// Customers now have their own Supabase Auth accounts (/account signup), so
// "authenticated" no longer implies "admin" — both share the same Postgres
// role. /admin/* requires a row in admin_users (checked via RLS-backed
// SELECT below); /account/* just requires any signed-in user.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isAdminLoginRoute = path === "/admin/login";
  const isAccountRoute = path.startsWith("/account");
  const isAccountAuthRoute = path === "/account/login" || path === "/account/signup";

  if (!isSupabaseConfigured) {
    if (isAdminRoute && !isAdminLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "not-configured");
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminRoute) {
    const isAdmin =
      !!user &&
      !!(
        await supabase.from("admin_users").select("userId").eq("userId", user.id).maybeSingle()
      ).data;

    if (!isAdminLoginRoute && !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      if (user) url.searchParams.set("error", "not-admin");
      return NextResponse.redirect(url);
    }
    if (isAdminLoginRoute && isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/products";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (isAccountRoute) {
    if (!isAccountAuthRoute && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/account/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    if (isAccountAuthRoute && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
