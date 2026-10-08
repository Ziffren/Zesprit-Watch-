import { getUnreadMessageCount } from "@/lib/admin/queries";
import { AdminNav } from "../nav-links";

// Every /admin route needs the signed-in user's session and live Supabase
// data — never prerender or cache it at build time.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const unreadCount = await getUnreadMessageCount();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="admin-sidebar__brand">Z&rsquo;esprit Watch</p>
        <AdminNav unreadMessageCount={unreadCount} />
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
