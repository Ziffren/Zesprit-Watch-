import { listCollections } from "@/lib/admin/queries";
import type { ProductWithRelations } from "@/lib/admin/types";
import { RichTextEditor } from "./rich-text-editor";
import { MediaGrid } from "./media-grid";
import { TagsField } from "./tags-field";
import { saveProduct } from "./actions";

export async function ProductForm({ product }: { product: ProductWithRelations }) {
  const collections = await listCollections();
  const assigned = new Set(product.watch_collections.map((wc) => wc.collectionId));

  return (
    <form className="admin-form" action={saveProduct}>
      <input type="hidden" name="id" value={product.id} />

      <div className="admin-form__main">
        <div className="admin-panel">
          <label className="admin-field">
            <span>Title</span>
            <input name="productName" defaultValue={product.productName} required />
          </label>
          <label className="admin-field">
            <span>Brand</span>
            <input name="brand" defaultValue={product.brand} required />
          </label>
          <label className="admin-field">
            <span>Description</span>
            <RichTextEditor name="descriptionHtml" initialHtml={product.descriptionHtml} />
          </label>
        </div>

        <div className="admin-panel">
          <MediaGrid initialUrls={product.photoUrls} />
        </div>
      </div>

      <div className="admin-form__side">
        <div className="admin-panel">
          <h2>Status</h2>
          <span className="admin-badge" data-tone={product.status === "AVAILABLE" ? "active" : "draft"}>
            {product.status}
          </span>
          <p className="admin-hint">
            Read-only here — availability is set from Watch Report when the watch is sold.
          </p>
        </div>

        <div className="admin-panel">
          <h2>Organization</h2>
          <div className="admin-field">
            <span>Collections</span>
            <div className="admin-chip-select">
              {collections.length === 0 && <p className="admin-hint">No collections yet.</p>}
              {collections.map((c) => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    name="collection_ids"
                    value={c.id}
                    defaultChecked={assigned.has(c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <TagsField initialTags={product.tags} />
        </div>

        <div className="admin-form__actions">
          <button className="admin-btn admin-btn--primary" type="submit">
            Save product
          </button>
        </div>
      </div>
    </form>
  );
}
