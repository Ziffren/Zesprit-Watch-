import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PriceTable, type PriceRow } from "./price-table";

export const dynamic = "force-dynamic";

// Quick price entry for everything in stock (available + on hold).
export default async function BulkPricesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, productName, brand, status, priceCents, photoUrls")
    .in("status", ["AVAILABLE", "HOLD"])
    .order("brand")
    .order("productName");
  const rows: PriceRow[] = (data ?? []).map((p) => ({
    id: p.id,
    name: p.productName,
    brand: p.brand,
    status: p.status,
    priceCents: p.priceCents,
    thumb: p.photoUrls?.[0] ?? null,
  }));
  const unpriced = rows.filter((r) => r.priceCents == null).length;

  return (
    <>
      <header className="admin-topbar admin-topbar--product">
        <div>
          <Link className="admin-breadcrumb" href="/admin/products">
            ← Products
          </Link>
          <p className="admin-topbar__title">Edit prices</p>
        </div>
      </header>
      <div className="admin-content">
        <p className="admin-hint" style={{ marginBottom: "var(--space-md)" }}>
          Prices in USD for every piece in stock. {unpriced} of {rows.length} have no price yet and show &ldquo;Price on
          request&rdquo;. Type the prices, then save once — only changed rows are updated. Leave a box empty for
          &ldquo;Price on request&rdquo;. Reductions (original + sale price) are set on each product&rsquo;s own page.
        </p>
        <PriceTable rows={rows} />
      </div>
    </>
  );
}
