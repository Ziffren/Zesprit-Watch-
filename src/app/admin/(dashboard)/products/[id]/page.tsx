import { notFound } from "next/navigation";
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
      <header className="admin-topbar">
        <p className="admin-topbar__title">{product.productName}</p>
      </header>
      <div className="admin-content">
        <ProductForm product={product} />
      </div>
    </>
  );
}
