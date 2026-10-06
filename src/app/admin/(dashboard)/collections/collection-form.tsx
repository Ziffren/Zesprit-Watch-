import { listCollectionProductIds, listProductsForPicker } from "@/lib/admin/queries";
import type { Collection } from "@/lib/admin/types";
import { CoverImageField } from "../cover-image-field";
import { RichTextEditor } from "../products/rich-text-editor";
import { CollectionProducts } from "./collection-products";
import { deleteCollection, saveCollection } from "./actions";

export async function CollectionForm({ collection }: { collection: Collection | null }) {
  const [products, assignedIds] = await Promise.all([
    listProductsForPicker(),
    collection ? listCollectionProductIds(collection.id) : Promise.resolve([] as string[]),
  ]);

  return (
    <form className="admin-form" action={saveCollection}>
      <input type="hidden" name="id" value={collection?.id ?? ""} />

      <div className="admin-form__main">
        <div className="admin-panel">
          <label className="admin-field">
            <span>Title</span>
            <input
              name="name"
              defaultValue={collection?.name}
              placeholder="e.g. Grand Seiko, or Dress watches"
              required
            />
          </label>
          <label className="admin-field">
            <span>Slug</span>
            <input name="slug" defaultValue={collection?.slug} placeholder="auto-generated from title" />
          </label>
          <label className="admin-field">
            <span>Description</span>
            <RichTextEditor name="description" initialHtml={collection?.description ?? null} />
          </label>
        </div>

        <div className="admin-panel">
          <CollectionProducts
            allProducts={products}
            initialIds={assignedIds}
            brandName={collection?.isBrand ? collection.name : null}
          />
        </div>
      </div>

      <div className="admin-form__side">
        <div className="admin-panel">
          <h2>Collection type</h2>
          <label className="admin-field">
            <span>Type</span>
            <select name="collection_type" defaultValue={collection?.isBrand ? "brand" : "theme"}>
              <option value="brand">Brand</option>
              <option value="theme">Themed collection</option>
            </select>
          </label>
          <p className="admin-hint">
            Brand collections are what products pick their brand from (one per product). Themed
            collections are free groupings like &ldquo;GMT &amp; Travel&rdquo;.
          </p>
        </div>

        <div className="admin-panel">
          <CoverImageField initialUrl={collection?.coverImageUrl ?? null} />
        </div>

        <div className="admin-form__actions" style={{ justifyContent: "space-between" }}>
          {collection ? (
            <button className="admin-btn admin-btn--danger" type="submit" formAction={deleteCollection}>
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
