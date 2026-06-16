"use client";

import { useOrderBook } from "@/hooks/useOrderBook";
import type { BookLevel, TokenId, WsStatus } from "@/lib/pm/types";

const fmtPrice = (p: number) => p.toFixed(3);
const fmtSize = (s: number) => s.toLocaleString(undefined, { maximumFractionDigits: 2 });

const STATUS_META: Record<WsStatus, { label: string; dot: string; text: string }> = {
  open: { label: "Live", dot: "bg-emerald-500 animate-pulse", text: "text-emerald-400" },
  connecting: { label: "Connecting", dot: "bg-amber-500 animate-pulse", text: "text-amber-400" },
  reconnecting: { label: "Reconnecting", dot: "bg-amber-500 animate-pulse", text: "text-amber-400" },
  closed: { label: "Offline", dot: "bg-zinc-600", text: "text-zinc-500" },
};

const DEPTH = 8;

function Row({ level, max, side }: { level: BookLevel; max: number; side: "bid" | "ask" }) {
  const width = max > 0 ? `${Math.max(2, (level.size / max) * 100)}%` : "0%";
  const fill = side === "bid" ? "bg-emerald-500/10" : "bg-rose-500/10";
  const priceColor = side === "bid" ? "text-emerald-400" : "text-rose-400";
  return (
    <div className="relative flex items-center justify-between px-2 py-0.5 text-xs">
      <div className={`absolute inset-y-0 right-0 ${fill}`} style={{ width }} />
      <span className={`tnum relative z-10 ${priceColor}`}>{fmtPrice(level.price)}</span>
      <span className="tnum relative z-10 text-zinc-300">{fmtSize(level.size)}</span>
    </div>
  );
}

/**
 * Live order book for a single outcome token. Reads from useOrderBook (REST
 * snapshot seeded, then WS deltas). Asks render best-near-the-spread (so the
 * list is reversed); bids render best-first below the spread.
 */
export function OrderBook({ tokenId }: { tokenId: TokenId | null }) {
  const { book, status, error } = useOrderBook(tokenId);
  const meta = STATUS_META[status];

  const asks = book?.asks.slice(0, DEPTH) ?? [];
  const bids = book?.bids.slice(0, DEPTH) ?? [];
  const maxSize = Math.max(1, ...asks.map((l) => l.size), ...bids.map((l) => l.size));

  const bestAsk = book?.asks[0]?.price;
  const bestBid = book?.bids[0]?.price;
  const spread = bestAsk != null && bestBid != null ? bestAsk - bestBid : null;
  const mid = bestAsk != null && bestBid != null ? (bestAsk + bestBid) / 2 : null;

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/40">
      <header className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <h3 className="text-sm font-medium text-zinc-200">Order book</h3>
        <span className={`flex items-center gap-1.5 text-xs ${meta.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </header>

      {!tokenId ? (
        <p className="px-3 py-6 text-center text-xs text-zinc-500">Select an outcome.</p>
      ) : error ? (
        <p className="px-3 py-6 text-center text-xs text-rose-400">{error}</p>
      ) : !book ? (
        <p className="px-3 py-6 text-center text-xs text-zinc-500">Loading book…</p>
      ) : (
        <div className="py-1">
          <div className="flex justify-between px-2 pb-1 text-[10px] uppercase tracking-wide text-zinc-500">
            <span>Price</span>
            <span>Size</span>
          </div>

          <div className="flex flex-col-reverse">
            {asks.map((level) => (
              <Row key={`a-${level.price}`} level={level} max={maxSize} side="ask" />
            ))}
          </div>

          <div className="my-1 flex items-center justify-between border-y border-zinc-800 px-2 py-1 text-xs">
            <span className="tnum text-zinc-300">{mid != null ? fmtPrice(mid) : "—"}</span>
            <span className="tnum text-zinc-500">
              spread {spread != null ? fmtPrice(spread) : "—"}
            </span>
          </div>

          <div className="flex flex-col">
            {bids.map((level) => (
              <Row key={`b-${level.price}`} level={level} max={maxSize} side="bid" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
