// Shared shapes for the Polymarket data layer.
//
// The single most important invariant this file encodes is the distinction
// between the two identifiers Polymarket uses, which are easy to swap and
// produce silently wrong data when you do:
//
//   • TokenId      — per OUTCOME (an ERC-1155 position id). Use for order
//                    books, price snapshots, price history, and as the WS
//                    market-channel asset id.
//   • ConditionId  — per MARKET. Use for positions, holders, and trades.
//
// They are modeled as branded strings so the compiler refuses to let one be
// passed where the other is expected. Use the `asTokenId` / `asConditionId`
// helpers at the boundary where raw strings enter the system.

export type TokenId = string & { readonly __brand: "TokenId" };
export type ConditionId = string & { readonly __brand: "ConditionId" };

export const asTokenId = (raw: string): TokenId => raw as TokenId;
export const asConditionId = (raw: string): ConditionId => raw as ConditionId;

// ── Gamma (raw) ────────────────────────────────────────────────────────────
// Gamma encodes `outcomes`, `outcomePrices`, and `clobTokenIds` as JSON strings
// (e.g. "[\"Yes\",\"No\"]"). They are index-aligned with each other. rest.ts is
// responsible for parsing them defensively; never JSON.parse them in the UI.
export interface GammaRawMarket {
  id: string;
  question: string;
  conditionId: string;
  slug?: string;
  outcomes: string; // JSON-encoded string[]
  outcomePrices: string; // JSON-encoded string[]
  clobTokenIds: string; // JSON-encoded string[]
  volume?: string | number;
  volume24hr?: string | number;
  liquidity?: string | number;
  active?: boolean;
  closed?: boolean;
  endDate?: string;
  image?: string;
  [key: string]: unknown;
}

// ── Normalized domain shapes (what the UI consumes) ─────────────────────────
export interface Outcome {
  label: string; // outcomes[i]
  price: number; // outcomePrices[i], probability in [0, 1]
  tokenId: TokenId; // clobTokenIds[i]
}

export interface Market {
  id: string;
  question: string;
  conditionId: ConditionId;
  slug?: string;
  outcomes: Outcome[]; // index-aligned across label/price/tokenId
  volume: number;
  volume24hr: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  endDate?: string;
  image?: string;
}

// ── Order book ──────────────────────────────────────────────────────────────
export interface BookLevel {
  price: number; // in [0, 1]
  size: number;
}

export interface OrderBookSnapshot {
  tokenId: TokenId;
  bids: BookLevel[]; // sorted best-first: descending price
  asks: BookLevel[]; // sorted best-first: ascending price
  hash?: string;
  timestamp?: number;
}

// A single level mutation from a `price_change` WS frame. An absolute size of 0
// removes the level; any other size replaces it.
export interface BookDelta {
  price: number;
  size: number;
  side: "BUY" | "SELL";
}

// ── Price history (charts) ──────────────────────────────────────────────────
export interface PricePoint {
  t: number; // unix seconds
  p: number; // price in [0, 1]
}

// ── WebSocket status ────────────────────────────────────────────────────────
export type WsStatus = "connecting" | "open" | "reconnecting" | "closed";
