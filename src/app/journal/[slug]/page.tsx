import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/storefront";
import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";

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
            <Image
              className="journal-post__cover"
              src={post.coverImageUrl}
              alt={post.title}
              width={1600}
              height={900}
              quality={90}
              priority
              sizes="(max-width: 960px) 100vw, 60rem"
            />
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

      <SiteFooter />
    </>
  );
}
