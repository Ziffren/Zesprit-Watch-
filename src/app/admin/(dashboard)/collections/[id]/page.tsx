import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollection } from "@/lib/admin/queries";
import { CollectionForm } from "../collection-form";

export const dynamic = "force-dynamic";

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await getCollection(id);
  if (!collection) notFound();

  return (
    <>
      <header className="admin-topbar admin-topbar--product">
        <div>
          <Link className="admin-breadcrumb" href="/admin/collections">
            ← Collections
          </Link>
          <div className="admin-topbar__heading">
            <p className="admin-topbar__title">{collection.name}</p>
            <span className="admin-badge" data-tone={collection.isBrand || collection.isSmart ? "active" : "draft"}>
              {collection.isSmart ? "Automated" : collection.isBrand ? "Brand" : "Manual"}
            </span>
          </div>
        </div>
      </header>
      <div className="admin-content">
        <CollectionForm collection={collection} />
      </div>
    </>
  );
}
