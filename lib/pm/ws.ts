// Market-channel WebSocket client.
//
// WebSockets are CORS-exempt, so this connects DIRECTLY to Polymarket from the
// browser (no proxy route). Responsibilities:
//   • open the socket and send the subscribe frame on `open`
//   • keep it alive with a periodic PING (~10s)
//   • deliver `book` snapshots and `price_change` deltas to handlers
//   • reconnect with exponential backoff
//
// Delta application is a pure function (`applyPriceChanges`) so the consumer
// (hooks/useOrderBook.ts) owns the snapshot+delta merge and this module stays
// transport-only.

import {
  asTokenId,
  type BookDelta,
  type BookLevel,
  type OrderBookSnapshot,
  type TokenId,
  type WsStatus,
} from "./types";

const WS_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market";
const PING_INTERVAL_MS = 10_000;
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

export interface MarketChannelHandlers {
  onBook?: (snapshot: OrderBookSnapshot) => void;
  onPriceChange?: (tokenId: TokenId, changes: BookDelta[]) => void;
  onStatus?: (status: WsStatus) => void;
}

export interface MarketChannel {
  close: () => void;
}

const toNumber = (value: unknown): number => {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : NaN;
};

// The book event uses `bids`/`asks`; some deployments label them `buys`/`sells`.
// Accept either so a field rename upstream doesn't blank the book.
const toLevels = (raw: unknown): BookLevel[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((lvl) => ({
      price: toNumber((lvl as { price?: unknown }).price),
      size: toNumber((lvl as { size?: unknown }).size),
    }))
    .filter((lvl) => Number.isFinite(lvl.price) && Number.isFinite(lvl.size));
};

const sortBook = (bids: BookLevel[], asks: BookLevel[]) => ({
  bids: [...bids].sort((a, b) => b.price - a.price),
  asks: [...asks].sort((a, b) => a.price - b.price),
});

/**
 * Apply `price_change` deltas onto the last known snapshot. Pure: returns a new
 * snapshot. A level with absolute size 0 is removed; any other size replaces the
 * level at that price. Side BUY -> bids, SELL -> asks.
 */
export function applyPriceChanges(
  snapshot: OrderBookSnapshot,
  changes: BookDelta[],
): OrderBookSnapshot {
  const bids = new Map(snapshot.bids.map((l) => [l.price, l.size]));
  const asks = new Map(snapshot.asks.map((l) => [l.price, l.size]));

  for (const change of changes) {
    const side = change.side === "BUY" ? bids : asks;
    if (change.size === 0) side.delete(change.price);
    else side.set(change.price, change.size);
  }

  const { bids: sortedBids, asks: sortedAsks } = sortBook(
    [...bids].map(([price, size]) => ({ price, size })),
    [...asks].map(([price, size]) => ({ price, size })),
  );

  return { ...snapshot, bids: sortedBids, asks: sortedAsks };
}

// ── message routing ─────────────────────────────────────────────────────────

function routeEvent(event: Record<string, unknown>, handlers: MarketChannelHandlers): void {
  const type = event.event_type;
  const assetId = event.asset_id;
  if (typeof assetId !== "string") return;
  const tokenId = asTokenId(assetId);

  if (type === "book") {
    const { bids, asks } = sortBook(
      toLevels(event.bids ?? event.buys),
      toLevels(event.asks ?? event.sells),
    );
    handlers.onBook?.({
      tokenId,
      bids,
      asks,
      hash: typeof event.hash === "string" ? event.hash : undefined,
      timestamp: event.timestamp !== undefined ? toNumber(event.timestamp) : undefined,
    });
    return;
  }

  if (type === "price_change") {
    const rawChanges = Array.isArray(event.changes) ? event.changes : [];
    const changes: BookDelta[] = rawChanges
      .map((c) => {
        const side = String((c as { side?: unknown }).side).toUpperCase();
        return {
          price: toNumber((c as { price?: unknown }).price),
          size: toNumber((c as { size?: unknown }).size),
          side: side === "SELL" ? "SELL" : "BUY",
        } as BookDelta;
      })
      .filter((c) => Number.isFinite(c.price) && Number.isFinite(c.size));
    if (changes.length > 0) handlers.onPriceChange?.(tokenId, changes);
  }
}

function handleMessage(raw: unknown, handlers: MarketChannelHandlers): void {
  if (typeof raw !== "string") return;
  if (raw === "PONG" || raw === "PING") return; // keep-alive echoes
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  // The server may batch multiple events into a single array frame.
  const events = Array.isArray(parsed) ? parsed : [parsed];
  for (const event of events) {
    if (event && typeof event === "object") {
      routeEvent(event as Record<string, unknown>, handlers);
    }
  }
}

// ── connection lifecycle ────────────────────────────────────────────────────

/**
 * Open a market-channel subscription for the given token ids. Returns a handle
 * whose `close()` tears down the socket and stops reconnecting.
 */
export function openMarketChannel(
  tokenIds: TokenId[],
  handlers: MarketChannelHandlers,
): MarketChannel {
  let ws: WebSocket | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let attempts = 0;
  let closed = false;

  const setStatus = (status: WsStatus) => handlers.onStatus?.(status);

  const clearTimers = () => {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (closed) return;
    const delay = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempts);
    attempts += 1;
    setStatus("reconnecting");
    reconnectTimer = setTimeout(connect, delay);
  };

  function connect(): void {
    if (closed || typeof WebSocket === "undefined") return;
    setStatus("connecting");
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      attempts = 0;
      setStatus("open");
      // Subscribe frame for the market channel: note the `assets_ids` spelling.
      ws?.send(JSON.stringify({ assets_ids: tokenIds, type: "market" }));
      pingTimer = setInterval(() => {
        try {
          ws?.send("PING");
        } catch {
          /* socket already gone; onclose will handle reconnect */
        }
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (event) => handleMessage(event.data, handlers);

    ws.onclose = () => {
      clearTimers();
      if (!closed) scheduleReconnect();
    };

    // Errors surface as a subsequent close; nothing actionable here.
    ws.onerror = () => {};
  }

  connect();

  return {
    close() {
      closed = true;
      clearTimers();
      setStatus("closed");
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
      ws = null;
    },
  };
}
