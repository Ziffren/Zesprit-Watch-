import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

// Any authenticated Supabase user counts as admin here — this app shares its
// Auth user pool with Watch Report (admin.zespritwatch.com), which is itself
// single-owner (see that project's requireUser()). No separate admin_users
// table needed.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = request.nextUrl.pathname === "/admin/login";

  if (!isSupabaseConfigured) {
    if (isAdminRoute && !isLoginRoute) {
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

  if (isAdminRoute && !isLoginRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (isLoginRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/products";
    return NextResponse.redirect(url);
  }

  return response;
}
