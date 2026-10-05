import { PostForm } from "../post-form";

export default function NewPostPage() {
  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">New post</p>
      </header>
      <div className="admin-content">
        <PostForm post={null} />
      </div>
    </>
  );
}
