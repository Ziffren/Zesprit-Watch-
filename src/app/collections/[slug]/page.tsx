import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COLLECTION_PAGE_SIZE, getCollectionPage } from "@/lib/storefront";
import { SiteHeader } from "@/components/site-header";
import { ProductCard } from "@/components/product-card";

// Badges are date-based and stock changes often — always render fresh.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCollectionPage(slug, 1);
  return { title: c ? `${c.name} — Z’esprit Watch` : "Collection — Z’esprit Watch" };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const c = await getCollectionPage(slug, Number(pageParam) || 1);
  if (!c) notFound();

  const from = c.total === 0 ? 0 : (c.page - 1) * COLLECTION_PAGE_SIZE + 1;
  const to = Math.min(c.page * COLLECTION_PAGE_SIZE, c.total);
  const href = (p: number) => (p <= 1 ? `/collections/${c.slug}` : `/collections/${c.slug}?page=${p}`);

  return (
    <>
      <SiteHeader active={slug === "all" ? "shop" : "watches"} />

      <main className="collection-page">
        <nav className="collection-page__crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          {slug === "all" ? <span aria-current="page">All watches</span> : (
            <>
              <Link href="/collections/all">Watches</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{c.name}</span>
            </>
          )}
        </nav>

        <header className="collection-page__head">
          <h1 className="collection-page__title">{c.name}</h1>
          <p className="collection-page__count">
            {c.total === 0 ? "No pieces in stock right now" : `${c.total} ${c.total === 1 ? "piece" : "pieces"} in stock · highest price first`}
          </p>
          {c.descriptionHtml && (
            <div className="collection-page__desc rich-text-content" dangerouslySetInnerHTML={{ __html: c.descriptionHtml }} />
          )}
        </header>

        {c.total === 0 ? (
          <p className="collection-page__empty">
            Nothing from {c.name} is available at the moment — new pieces arrive regularly.{" "}
            <Link href="/collections/all">Browse all watches →</Link>
          </p>
        ) : (
          <ul className="collection-grid-public">
            {c.pieces.map((p) => (
              <li key={p.id}>
                <ProductCard piece={p} headingLevel={2} />
              </li>
            ))}
          </ul>
        )}

        {c.pageCount > 1 && (
          <nav className="collection-page__pager" aria-label="Pages">
            {c.page > 1 ? <Link href={href(c.page - 1)}>← Previous</Link> : <span />}
            <span>
              {from}–{to} of {c.total}
            </span>
            {c.page < c.pageCount ? <Link href={href(c.page + 1)}>Next →</Link> : <span />}
          </nav>
        )}
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
