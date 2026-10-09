import Link from "next/link";
import { getPublishedPosts } from "@/lib/storefront";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <header className="detail-header">
        <Link className="detail-header__back" href="/">
          ← Z&rsquo;esprit Watch
        </Link>
      </header>

      <main>
        <header className="head-hang">
          <h2 className="head-hang__title">Journal</h2>
          <p className="head-hang__lede">
            Notes on watchmaking, restoration, and the pieces that pass through our hands.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="journal-empty">Nothing published yet — check back soon.</p>
        ) : (
          <section className="product-grid" aria-label="Journal articles">
            {posts.map((p) => (
              <article className="product" key={p.id}>
                <div className="product__media">
                  {p.coverImageUrl ? (
                    <Image src={p.coverImageUrl} alt={p.title} fill quality={85} sizes="(max-width: 960px) 50vw, 33vw" />
                  ) : (
                    <div className="journal-card__placeholder" aria-hidden="true">
                      <span>{p.title.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="product__meta">
                  <h3 className="product__name">{p.title}</h3>
                  {p.excerpt && <p className="product__detail">{p.excerpt}</p>}
                  {p.publishedAt && (
                    <p className="product__price">
                      {new Date(p.publishedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <Link className="product__view" href={`/journal/${p.slug}`}>
                  Read more →
                </Link>
              </article>
            ))}
          </section>
        )}
      </main>

      <footer className="foot-mast">
        <p className="wordmark">Z&rsquo;esprit Watch</p>
        <p className="tagline muted">Vintage watches, restored to keep time again.</p>
        <p className="links muted">
          <Link href="/journal">Journal</Link> · Care Guide · <Link href="/contact">Contact</Link> · <Link href="/privacy">Privacy</Link>
        </p>
      </footer>
    </>
  );
}
