import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct } from "@/lib/admin/queries";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <>
      <header className="admin-topbar admin-topbar--product">
        <div>
          <Link className="admin-breadcrumb" href="/admin/products">
            ← Products
          </Link>
          <div className="admin-topbar__heading">
            <p className="admin-topbar__title">{product.productName}</p>
            <span
              className="admin-badge"
              data-tone={product.status === "AVAILABLE" ? "active" : product.status === "HOLD" ? "hold" : "draft"}
            >
              {product.status}
            </span>
          </div>
        </div>
        <a
          className="admin-btn"
          href={`/watches/${product.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View
        </a>
      </header>
      <div className="admin-content">
        <ProductForm product={product} />
      </div>
    </>
  );
}
