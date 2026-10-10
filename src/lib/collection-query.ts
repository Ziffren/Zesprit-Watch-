// Filter/sort state for watch listings — shared by the server query and the
// client filter bar, so it carries no server imports.

export const SORTS = [
  { value: "price-desc", label: "Price, high to low" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "popular", label: "Most loved" },
] as const;
export type SortValue = (typeof SORTS)[number]["value"];
export type StatusFilter = "available" | "sold" | "all";

export type CollectionQuery = { sort: SortValue; status: StatusFilter; sale: boolean; page: number };

export function parseCollectionQuery(sp: Record<string, string | undefined>): CollectionQuery {
  const sort = (SORTS.some((x) => x.value === sp.sort) ? sp.sort : "price-desc") as SortValue;
  const status: StatusFilter = sp.status === "sold" || sp.status === "all" ? sp.status : "available";
  return { sort, status, sale: sp.sale === "1", page: Math.max(1, Number(sp.page) || 1) };
}
