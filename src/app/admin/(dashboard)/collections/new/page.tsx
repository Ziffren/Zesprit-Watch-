import { CollectionForm } from "../collection-form";

export default function NewCollectionPage() {
  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">New collection</p>
      </header>
      <div className="admin-content">
        <CollectionForm collection={null} />
      </div>
    </>
  );
}
