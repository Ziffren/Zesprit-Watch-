import type { Post } from "@/lib/admin/types";
import { RichTextEditor } from "../products/rich-text-editor";
import { CoverImageField } from "../cover-image-field";
import { savePost, deletePost } from "./actions";

export function PostForm({ post }: { post: Post | null }) {
  return (
    <form className="admin-form" action={savePost}>
      <input type="hidden" name="id" value={post?.id ?? ""} />
      <input type="hidden" name="wasPublished" value={post?.status === "PUBLISHED" ? "true" : "false"} />

      <div className="admin-form__main">
        <div className="admin-panel">
          <label className="admin-field">
            <span>Title</span>
            <input name="title" defaultValue={post?.title} required />
          </label>
          <label className="admin-field">
            <span>Slug</span>
            <input name="slug" defaultValue={post?.slug} placeholder="auto-generated from title" />
          </label>
          <label className="admin-field">
            <span>Excerpt</span>
            <textarea
              name="excerpt"
              rows={2}
              defaultValue={post?.excerpt ?? ""}
              placeholder="Shown on the Journal list page."
            />
          </label>
          <label className="admin-field">
            <span>Body</span>
            <RichTextEditor name="bodyHtml" initialHtml={post?.bodyHtml ?? null} />
          </label>
        </div>
      </div>

      <div className="admin-form__side">
        <div className="admin-panel">
          <CoverImageField initialUrl={post?.coverImageUrl ?? null} pathPrefix="posts" />
        </div>

        <div className="admin-panel">
          <h2>Status</h2>
          <label className="admin-field">
            <span>Visibility</span>
            <select name="status" defaultValue={post?.status ?? "DRAFT"}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </label>
          {post?.publishedAt && (
            <p className="admin-hint">
              First published {new Date(post.publishedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="admin-form__actions" style={{ justifyContent: "space-between" }}>
          {post ? (
            <button className="admin-btn admin-btn--danger" type="submit" formAction={deletePost}>
              Delete
            </button>
          ) : (
            <span />
          )}
          <button className="admin-btn admin-btn--primary" type="submit">
            Save post
          </button>
        </div>
      </div>
    </form>
  );
}
