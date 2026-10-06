import Link from "next/link";
import { CollectionForm } from "../collection-form";

export const dynamic = "force-dynamic";

export default function NewCollectionPage() {
  return (
    <>
      <header className="admin-topbar admin-topbar--product">
        <div>
          <Link className="admin-breadcrumb" href="/admin/collections">
            ← Collections
          </Link>
          <div className="admin-topbar__heading">
            <p className="admin-topbar__title">New collection</p>
          </div>
        </div>
      </header>
      <div className="admin-content">
        <CollectionForm collection={null} />
      </div>
    </>
  );
}
