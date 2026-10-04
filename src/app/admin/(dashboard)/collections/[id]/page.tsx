import { notFound } from "next/navigation";
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
      <header className="admin-topbar">
        <p className="admin-topbar__title">{collection.name}</p>
      </header>
      <div className="admin-content">
        <CollectionForm collection={collection} />
      </div>
    </>
  );
}
