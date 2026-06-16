"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchMarkets } from "@/lib/pm/rest";
import type { Market } from "@/lib/pm/types";

const fmtUsd = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

interface MarketListProps {
  query: string;
  selectedId: string | null;
  onSelect: (market: Market) => void;
}

/**
 * Discovery list. Fetches normalized markets from lib/pm (token-less markets are
 * already filtered out there) and filters client-side by the search query.
 */
export function MarketList({ query, selectedId, onSelect }: MarketListProps) {
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMarkets({ limit: 60, order: "volume24hr", ascending: false })
      .then((data) => {
        if (!cancelled) setMarkets(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = markets ?? [];
    return q ? list.filter((m) => m.question.toLowerCase().includes(q)) : list;
  }, [markets, query]);

  if (error) {
    return <p className="px-3 py-6 text-sm text-rose-400">Failed to load markets: {error}</p>;
  }
  if (!markets) {
    return <p className="px-3 py-6 text-sm text-zinc-500">Loading markets…</p>;
  }
  if (filtered.length === 0) {
    return <p className="px-3 py-6 text-sm text-zinc-500">No markets match “{query}”.</p>;
  }

  return (
    <ul className="flex flex-col">
      {filtered.map((market) => {
        const top = market.outcomes[0];
        const selected = market.id === selectedId;
        return (
          <li key={market.id}>
            <button
              type="button"
              onClick={() => onSelect(market)}
              className={[
                "flex w-full flex-col gap-1 border-b border-zinc-800/70 px-3 py-3 text-left transition-colors",
                selected ? "bg-zinc-800/60" : "hover:bg-zinc-800/30",
              ].join(" ")}
            >
              <span className="line-clamp-2 text-sm text-zinc-100">{market.question}</span>
              <span className="flex items-center justify-between text-xs text-zinc-500">
                <span className="tnum">Vol {fmtUsd(market.volume)}</span>
                {top && (
                  <span className="tnum text-zinc-300">
                    {top.label} {(top.price * 100).toFixed(0)}%
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
