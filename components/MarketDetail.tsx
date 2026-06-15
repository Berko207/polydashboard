"use client";

import { useState } from "react";

import type { Market, TokenId } from "@/lib/pm/types";
import { OrderBook } from "./OrderBook";
import { PriceChart } from "./PriceChart";
import { ProbBar } from "./ProbBar";

const fmtUsd = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

/**
 * Detail panel for the selected market. Owns which OUTCOME (token id) is active;
 * the order book and price chart are per-outcome (per token), while the market's
 * volume/liquidity and condition id are per-market. Defaults to the first
 * outcome and resets when the market changes.
 */
export function MarketDetail({ market }: { market: Market | null }) {
  // Track the picked outcome together with its market id; when the market
  // changes the selection no longer matches and we fall back to the first
  // outcome — derived during render, no effect needed.
  const [picked, setPicked] = useState<{ marketId: string; tokenId: TokenId } | null>(null);
  const tokenId = market
    ? picked?.marketId === market.id
      ? picked.tokenId
      : (market.outcomes[0]?.tokenId ?? null)
    : null;

  if (!market) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-800 p-10 text-sm text-zinc-500">
        Select a market to see its order book, price history, and probabilities.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-zinc-100">{market.question}</h2>
        <div className="tnum flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
          <span>Vol {fmtUsd(market.volume)}</span>
          <span>Liq {fmtUsd(market.liquidity)}</span>
          <span className="truncate">condition {market.conditionId.slice(0, 10)}…</span>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <h3 className="mb-2 text-sm font-medium text-zinc-200">Outcomes</h3>
            <ProbBar
              outcomes={market.outcomes}
              selectedTokenId={tokenId}
              onSelect={(o) => setPicked({ marketId: market.id, tokenId: o.tokenId })}
            />
          </div>
          <PriceChart tokenId={tokenId} />
        </div>

        <OrderBook tokenId={tokenId} />
      </div>
    </div>
  );
}
