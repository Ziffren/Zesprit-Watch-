import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COLLECTION_PAGE_SIZE, getCollectionPage } from "@/lib/storefront";
import { parseCollectionQuery, type CollectionQuery } from "@/lib/collection-query";
import { SiteHeader } from "@/components/site-header";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { FilterBar } from "./filter-bar";

// Badges are date-based and stock changes often — always render fresh.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCollectionPage(slug, parseCollectionQuery({}));
  return { title: c ? `${c.name} — Z’esprit Watch` : "Collection — Z’esprit Watch" };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const query = parseCollectionQuery(await searchParams);
  const c = await getCollectionPage(slug, query);
  if (!c) notFound();

  const from = c.total === 0 ? 0 : (c.page - 1) * COLLECTION_PAGE_SIZE + 1;
  const to = Math.min(c.page * COLLECTION_PAGE_SIZE, c.total);
  const href = (p: number) => {
    const sp = new URLSearchParams();
    if (query.sort !== "price-desc") sp.set("sort", query.sort);
    if (query.status !== "available") sp.set("status", query.status);
    if (query.sale) sp.set("sale", "1");
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/collections/${c.slug}?${qs}` : `/collections/${c.slug}`;
  };

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
          {c.descriptionHtml && (
            <div className="collection-page__desc rich-text-content" dangerouslySetInnerHTML={{ __html: c.descriptionHtml }} />
          )}
        </header>

        <FilterBar query={query} total={c.total} />

        {c.total === 0 ? (
          <p className="collection-page__empty">
            {emptyText(c.name, query)}{" "}
            {isFiltered(query) ? (
              <Link href={`/collections/${c.slug}`}>Clear filters →</Link>
            ) : (
              <Link href="/collections/all">Browse all watches →</Link>
            )}
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

      <SiteFooter />
    </>
  );
}

const isFiltered = (q: CollectionQuery) => q.status !== "available" || q.sale;

function emptyText(name: string, q: CollectionQuery) {
  if (q.sale) return `Nothing from ${name} is on sale right now.`;
  if (q.status === "sold") return `No sold pieces from ${name} yet.`;
  return `Nothing from ${name} is available at the moment — new pieces arrive regularly.`;
}
