import { listCollections } from "@/lib/admin/queries";
import { matchesCollection } from "@/lib/collection-rules";
import type { ProductWithRelations } from "@/lib/admin/types";
import { RichTextEditor } from "./rich-text-editor";
import { MediaGrid } from "./media-grid";
import { TagsField } from "./tags-field";
import { CollectionsField } from "./collections-field";
import { StatusField } from "./status-field";
import { deleteProduct, saveProduct } from "./actions";

export async function ProductForm({ product }: { product: ProductWithRelations | null }) {
  const collections = await listCollections();
  const brands = collections.filter((c) => c.isBrand);
  const themes = collections.filter((c) => !c.isBrand && !c.isSmart);
  const autoMatched = product
    ? collections.filter((c) => c.isSmart && matchesCollection(product, c))
    : [];
  const assigned = new Set(
    product ? product.watch_collections.map((wc) => wc.collectionId) : []
  );
  const currentBrandId = brands.find((b) => assigned.has(b.id))?.id;

  return (
    <form className="admin-form" action={saveProduct}>
      <input type="hidden" name="id" value={product?.id ?? ""} />

      <div className="admin-form__main">
        <div className="admin-panel">
          <label className="admin-field">
            <span>Title</span>
            <input name="productName" defaultValue={product?.productName} required />
          </label>
          <RichTextEditor name="descriptionHtml" label="Description" initialHtml={product?.descriptionHtml ?? null} />
        </div>

        <div className="admin-panel">
          <MediaGrid initialUrls={product?.photoUrls ?? []} />
        </div>

        <div className="admin-panel">
          <h2>Price</h2>
          <label className="admin-field">
            <span>Price (USD)</span>
            <input
              type="number"
              name="price"
              step="0.01"
              min="0"
              placeholder="Leave blank for &ldquo;Price on request&rdquo;"
              defaultValue={product?.priceCents != null ? (product.priceCents / 100).toFixed(2) : ""}
            />
          </label>
        </div>
      </div>

      <div className="admin-form__side">
        <div className="admin-panel">
          <h2>Status</h2>
          <StatusField initialStatus={product?.status ?? "AVAILABLE"} initialSoldAt={product?.soldAt ?? null} />
        </div>

        <div className="admin-panel">
          <h2>Organization</h2>
          <CollectionsField
            brands={brands.map(({ id, name }) => ({ id, name }))}
            themes={themes.map(({ id, name }) => ({ id, name }))}
            initialBrandId={currentBrandId ?? null}
            initialThemeIds={themes.filter((t) => assigned.has(t.id)).map((t) => t.id)}
          />

          {product && (
            <div className="admin-field">
              <span>Automated collections</span>
              <p className="admin-hint">
                {autoMatched.length > 0
                  ? `In ${autoMatched.map((c) => c.name).join(", ")} — added by their conditions (e.g. tags, price, date added). Change those to change this.`
                  : "Not in any automated collection right now."}
              </p>
            </div>
          )}

          <TagsField initialTags={product?.tags ?? []} />
        </div>

        <div className="admin-form__actions" style={{ justifyContent: "space-between" }}>
          {product ? (
            <button className="admin-btn admin-btn--danger" type="submit" formAction={deleteProduct}>
              Delete
            </button>
          ) : (
            <span />
          )}
          <button className="admin-btn admin-btn--primary" type="submit">
            Save product
          </button>
        </div>
      </div>
    </form>
  );
}
