import { notFound } from "next/navigation";
import { getPost } from "@/lib/admin/queries";
import { PostForm } from "../post-form";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <>
      <header className="admin-topbar">
        <p className="admin-topbar__title">{post.title}</p>
      </header>
      <div className="admin-content">
        <PostForm post={post} />
      </div>
    </>
  );
}
