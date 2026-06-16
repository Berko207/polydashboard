// Curated category bar for the discovery UI.
//
// Each entry maps a human label to a Gamma `/events` query: an optional
// `tagSlug` (Polymarket tag) plus the sort `order`. "Trending" and "New" carry
// no tag and just change the sort. The tag slugs below are Polymarket's
// well-known, stable category slugs — add/reorder freely to surface more
// subcategories; an unknown slug simply yields an empty list rather than an error.

export interface Category {
  key: string;
  label: string;
  tagSlug?: string; // undefined = no tag filter (all markets)
  order: string; // Gamma sort column
  ascending?: boolean; // defaults to false (descending)
}

export const CATEGORIES: Category[] = [
  { key: "trending", label: "Trending", order: "volume24hr" },
  { key: "new", label: "New", order: "startDate" },
  { key: "liquid", label: "Most Liquid", order: "liquidity" },
  { key: "politics", label: "Politics", tagSlug: "politics", order: "volume24hr" },
  { key: "crypto", label: "Crypto", tagSlug: "crypto", order: "volume24hr" },
  { key: "sports", label: "Sports", tagSlug: "sports", order: "volume24hr" },
  { key: "geopolitics", label: "Geopolitics", tagSlug: "geopolitics", order: "volume24hr" },
  { key: "economy", label: "Economy", tagSlug: "economy", order: "volume24hr" },
  { key: "tech", label: "Tech", tagSlug: "tech", order: "volume24hr" },
  { key: "culture", label: "Pop Culture", tagSlug: "pop-culture", order: "volume24hr" },
  { key: "world", label: "World", tagSlug: "world", order: "volume24hr" },
];

export const DEFAULT_CATEGORY = CATEGORIES[0];
