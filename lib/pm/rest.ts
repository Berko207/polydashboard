// Browser-side data client. The UI talks ONLY to this module (and, for live
// books, to the useOrderBook hook which sits on top of lib/pm/ws.ts).
//
// Every call here goes through our own /api/* proxy routes — never directly to a
// Polymarket REST host — so the browser is never subject to their missing CORS
// headers. Responses are normalized here so components never see Gamma's
// JSON-encoded-string quirks or the token-id / condition-id ambiguity.

import {
  asConditionId,
  asTokenId,
  type BookLevel,
  type GammaRawMarket,
  type Market,
  type Outcome,
  type OrderBookSnapshot,
  type PricePoint,
  type TokenId,
} from "./types";

// ── proxy plumbing ──────────────────────────────────────────────────────────

type Upstream = "gamma" | "clob" | "data";

async function proxyGet(
  upstream: Upstream,
  path: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<unknown> {
  const search = new URLSearchParams({ path });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const res = await fetch(`/api/${upstream}?${search.toString()}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`${upstream}/${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ── defensive parsing helpers ───────────────────────────────────────────────

const toNumber = (value: unknown, fallback = 0): number => {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Gamma returns `outcomes`, `outcomePrices`, and `clobTokenIds` as JSON-encoded
 * strings. Parse permissively: accept an already-decoded array, a JSON string,
 * or junk (-> empty). Never throw — a single malformed market must not break the
 * whole list.
 */
const parseStringArray = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string" && raw.length > 0) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
};

// ── Gamma: markets ──────────────────────────────────────────────────────────

/** Zip the three index-aligned Gamma arrays into typed outcomes. */
function buildOutcomes(raw: GammaRawMarket): Outcome[] {
  const labels = parseStringArray(raw.outcomes);
  const prices = parseStringArray(raw.outcomePrices);
  const tokenIds = parseStringArray(raw.clobTokenIds);

  // Guard against length drift: only emit outcomes that have all three pieces.
  const count = Math.min(labels.length, prices.length, tokenIds.length);
  const outcomes: Outcome[] = [];
  for (let i = 0; i < count; i += 1) {
    outcomes.push({
      label: labels[i],
      price: toNumber(prices[i]),
      tokenId: asTokenId(tokenIds[i]),
    });
  }
  return outcomes;
}

export function normalizeMarket(raw: GammaRawMarket): Market {
  return {
    id: String(raw.id),
    question: raw.question,
    conditionId: asConditionId(raw.conditionId),
    slug: raw.slug,
    outcomes: buildOutcomes(raw),
    volume: toNumber(raw.volume),
    volume24hr: toNumber(raw.volume24hr),
    liquidity: toNumber(raw.liquidity),
    active: raw.active ?? true,
    closed: raw.closed ?? false,
    endDate: raw.endDate,
    image: raw.image,
  };
}

export interface FetchMarketsParams {
  limit?: number;
  offset?: number;
  order?: string; // e.g. "volume24hr"
  ascending?: boolean;
  active?: boolean;
  closed?: boolean;
  tagSlug?: string;
}

export async function fetchMarkets(params: FetchMarketsParams = {}): Promise<Market[]> {
  const {
    limit = 24,
    offset = 0,
    order = "volume24hr",
    ascending = false,
    active = true,
    closed = false,
    tagSlug,
  } = params;

  const raw = await proxyGet("gamma", "markets", {
    limit,
    offset,
    order,
    ascending,
    active,
    closed,
    tag_slug: tagSlug,
  });

  const list = Array.isArray(raw) ? (raw as GammaRawMarket[]) : [];
  // Drop markets with no tradable outcomes (empty/missing clobTokenIds) so the
  // discovery UI never renders unclickable rows with no book to subscribe to.
  return list.map(normalizeMarket).filter((m) => m.outcomes.length > 0);
}

// ── CLOB: order book snapshot ───────────────────────────────────────────────

const toLevels = (raw: unknown): BookLevel[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((lvl) => ({
      price: toNumber((lvl as { price?: unknown }).price, NaN),
      size: toNumber((lvl as { size?: unknown }).size, NaN),
    }))
    .filter((lvl) => Number.isFinite(lvl.price) && Number.isFinite(lvl.size));
};

const sortBook = (snap: OrderBookSnapshot): OrderBookSnapshot => ({
  ...snap,
  bids: [...snap.bids].sort((a, b) => b.price - a.price), // best bid first
  asks: [...snap.asks].sort((a, b) => a.price - b.price), // best ask first
});

/** prices/books are keyed by TOKEN id, not condition id (CLOB `token_id`). */
export async function fetchBook(tokenId: TokenId): Promise<OrderBookSnapshot> {
  const raw = (await proxyGet("clob", "book", { token_id: tokenId })) as {
    bids?: unknown;
    asks?: unknown;
    hash?: string;
    timestamp?: string | number;
  };

  return sortBook({
    tokenId,
    bids: toLevels(raw.bids),
    asks: toLevels(raw.asks),
    hash: raw.hash,
    timestamp: raw.timestamp !== undefined ? toNumber(raw.timestamp) : undefined,
  });
}

// ── CLOB: price history (charts) ────────────────────────────────────────────

export interface FetchPriceHistoryParams {
  interval?: string; // "1m" | "1h" | "6h" | "1d" | "1w" | "max"
  fidelity?: number; // resolution in minutes
  startTs?: number;
  endTs?: number;
}

/**
 * Price history. NOTE: the CLOB endpoint's parameter is named `market` but it
 * takes the TOKEN id (per outcome), not the condition id. Easy to get wrong.
 */
export async function fetchPriceHistory(
  tokenId: TokenId,
  params: FetchPriceHistoryParams = {},
): Promise<PricePoint[]> {
  const { interval = "1d", fidelity, startTs, endTs } = params;

  const raw = (await proxyGet("clob", "prices-history", {
    market: tokenId, // <- token id, despite the param name
    interval,
    fidelity,
    startTs,
    endTs,
  })) as { history?: Array<{ t?: unknown; p?: unknown }> };

  const history = Array.isArray(raw.history) ? raw.history : [];
  return history
    .map((pt) => ({ t: toNumber(pt.t, NaN), p: toNumber(pt.p, NaN) }))
    .filter((pt) => Number.isFinite(pt.t) && Number.isFinite(pt.p));
}
