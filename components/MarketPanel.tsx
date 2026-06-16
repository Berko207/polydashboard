"use client";

import { useState } from "react";

import type { Market, TokenId } from "@/lib/pm/types";
import { OrderBook } from "./OrderBook";
import { PriceChart } from "./PriceChart";
import { ProbBar } from "./ProbBar";

/**
 * Trading view for a single market: outcome picker (drives the active token id),
 * price history, and live order book. The order book and chart are per-OUTCOME
 * (per token); the picked outcome is tagged with the market id and reconciled
 * during render, so switching markets falls back to the first outcome without an
 * effect.
 */
export function MarketPanel({ market }: { market: Market }) {
  const [picked, setPicked] = useState<{ marketId: string; tokenId: TokenId } | null>(null);
  const tokenId =
    picked?.marketId === market.id ? picked.tokenId : (market.outcomes[0]?.tokenId ?? null);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
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
  );
}
