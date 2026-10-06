import { getCollectionProductIds, listProductsForPicker } from "@/lib/admin/queries";
import type { Collection } from "@/lib/admin/types";
import { CoverImageField } from "../cover-image-field";
import { RichTextEditor } from "../products/rich-text-editor";
import { CollectionBuilder, type CollectionType } from "./collection-builder";
import { deleteCollection, saveCollection } from "./actions";

export async function CollectionForm({ collection }: { collection: Collection | null }) {
  const [products, manualIds] = await Promise.all([
    listProductsForPicker(),
    collection && !collection.isSmart ? getCollectionProductIds(collection) : Promise.resolve([] as string[]),
  ]);

  const type: CollectionType = collection?.isSmart ? "smart" : collection?.isBrand ? "brand" : "manual";

  const header = (
    <div key="collection-header" className="admin-panel collection-header">
      <CoverImageField initialUrl={collection?.coverImageUrl ?? null} />
      <div className="collection-header__fields">
        <label className="admin-field">
          <span>Title</span>
          <input
            name="name"
            defaultValue={collection?.name}
            placeholder="e.g. Grand Seiko, New Arrival, Sold List"
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
    </div>
  );

  const actions = (
    <div key="collection-actions" className="admin-form__actions" style={{ justifyContent: "space-between" }}>
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
  );

  return (
    <form className="admin-form" action={saveCollection}>
      <input type="hidden" name="id" value={collection?.id ?? ""} />
      <CollectionBuilder
        allProducts={products}
        initialType={type}
        initialMatchAll={collection?.matchAll ?? true}
        initialRules={collection?.rules ?? []}
        initialExcludeRules={collection?.excludeRules ?? []}
        initialManualIds={manualIds}
        savedName={collection?.name ?? null}
        // Server component, rendered once per request (force-dynamic page) — no re-render instability.
        // eslint-disable-next-line react-hooks/purity
        now={Date.now()}
        header={header}
        actions={actions}
      />
    </form>
  );
}
