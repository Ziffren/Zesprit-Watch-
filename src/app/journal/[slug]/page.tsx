import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function JournalPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <header className="detail-header">
        <Link className="detail-header__back" href="/journal">
          ← Journal
        </Link>
      </header>

      <main>
        <article className="journal-post">
          {post.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="journal-post__cover" src={post.coverImageUrl} alt={post.title} />
          )}
          <div className="journal-post__body">
            {post.publishedAt && (
              <p className="journal-post__date">
                {new Date(post.publishedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            <h1 className="journal-post__title">{post.title}</h1>
            {post.bodyHtml && (
              <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
            )}
          </div>
        </article>
      </main>

      <footer className="foot-mast">
        <p className="wordmark">Z&rsquo;esprit Watch</p>
        <p className="tagline muted">Vintage watches, restored to keep time again.</p>
        <p className="links muted">
          <Link href="/journal">Journal</Link> · Care Guide · <Link href="/contact">Contact</Link>
        </p>
      </footer>
    </>
  );
}
