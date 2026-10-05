import Link from "next/link";
import { ProductForm } from "../product-form";

export default function NewProductPage() {
  return (
    <>
      <header className="admin-topbar admin-topbar--product">
        <div>
          <Link className="admin-breadcrumb" href="/admin/products">
            ← Products
          </Link>
          <div className="admin-topbar__heading">
            <p className="admin-topbar__title">New product</p>
          </div>
        </div>
      </header>
      <div className="admin-content">
        <ProductForm product={null} />
      </div>
    </>
  );
}
