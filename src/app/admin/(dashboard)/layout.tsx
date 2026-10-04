import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";
import { AdminNav } from "../nav-links";

// Every /admin route needs the signed-in user's session and live Supabase
// data — never prerender or cache it at build time.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="admin-sidebar__brand">Z&rsquo;esprit Watch</p>
        <AdminNav />
        <div className="admin-sidebar__footer">
          {user?.email && <p className="admin-sidebar__email">{user.email}</p>}
          <form action={signOut}>
            <button className="admin-btn admin-btn--ghost" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
