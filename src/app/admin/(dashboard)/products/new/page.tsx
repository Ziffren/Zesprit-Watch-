import { ProductForm } from "../product-form";

export default function NewProductPage() {
  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">New product</p>
      </header>
      <div className="admin-content">
        <ProductForm product={null} />
      </div>
    </>
  );
}
