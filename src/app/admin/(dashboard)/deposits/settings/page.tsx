import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS, type ShopSettings } from "@/lib/deposits";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function DepositSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("shop_settings").select("depositPercent, holdDays, paymentInstructions").eq("id", 1).maybeSingle();
  const settings: ShopSettings = data ?? DEFAULT_SETTINGS;
  return (
    <>
      <header className="admin-topbar admin-topbar--product">
        <div>
          <Link className="admin-breadcrumb" href="/admin/deposits">
            ← Deposits
          </Link>
          <p className="admin-topbar__title">Deposit settings</p>
        </div>
      </header>
      <div className="admin-content">
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
