import { listProducts } from "@/lib/admin/queries";
import type { Collection } from "@/lib/admin/types";
import { CoverImageField } from "../cover-image-field";
import { deleteCollection, saveCollection } from "./actions";

export async function CollectionForm({ collection }: { collection: Collection | null }) {
  const products = await listProducts();
  const assigned = new Set(
    collection
      ? products
          .filter((p) => p.watch_collections.some((wc) => wc.collectionId === collection.id))
          .map((p) => p.id)
      : []
  );

  return (
    <form className="admin-form" action={saveCollection}>
      <input type="hidden" name="id" value={collection?.id ?? ""} />

      <div className="admin-form__main">
        <div className="admin-panel">
          <label className="admin-field">
            <span>Name</span>
            <input name="name" defaultValue={collection?.name} required />
          </label>
          <label className="admin-field">
            <span>Slug</span>
            <input name="slug" defaultValue={collection?.slug} placeholder="auto-generated from name" />
          </label>
          <label className="admin-field">
            <span>Description</span>
            <textarea name="description" rows={4} defaultValue={collection?.description ?? ""} />
          </label>
        </div>

        <div className="admin-panel">
          <h2>Watches in this collection</h2>
          <p className="admin-hint">
            Brand-based grouping doesn&rsquo;t need a collection — the storefront can already
            filter by brand directly. Use collections for themed groupings (e.g. &ldquo;GMT &amp;
            Travel&rdquo;).
          </p>
          <div className="admin-chip-select">
            {products.length === 0 && <p className="admin-hint">No watches yet.</p>}
            {products.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  name="product_ids"
                  value={p.id}
                  defaultChecked={assigned.has(p.id)}
                />
                {p.productName}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-form__side">
        <div className="admin-panel">
          <CoverImageField initialUrl={collection?.coverImageUrl ?? null} />
        </div>

        <div className="admin-form__actions" style={{ justifyContent: "space-between" }}>
          {collection ? (
            <button
              className="admin-btn admin-btn--danger"
              type="submit"
              formAction={deleteCollection}
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <button className="admin-btn admin-btn--primary" type="submit">
            Save collection
          </button>
        </div>
      </div>
    </form>
  );
}
