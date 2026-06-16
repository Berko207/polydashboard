"use client";

import { useState } from "react";

import { fmtUsd } from "@/lib/format";
import type { Market, PMEvent } from "@/lib/pm/types";
import { MarketPanel } from "./MarketPanel";

// For a grouped event each leg is a Yes/No market; the "Yes" price is the
// candidate's implied probability. Fall back to the first outcome if unlabeled.
const yesOutcome = (m: Market) =>
  m.outcomes.find((o) => o.label.toLowerCase() === "yes") ?? m.outcomes[0];
const repLabel = (m: Market) => m.groupItemTitle?.trim() || m.question;

/**
 * Detail view for the selected event.
 *   • Single-market event  → render its trading panel directly.
 *   • Grouped event (many)  → rank the constituent markets by implied
 *     probability; selecting one drills into its live book + chart.
 * The picked constituent is tagged with the event id so changing events clears
 * the selection during render.
 */
export function EventDetail({ event }: { event: PMEvent | null }) {
  const [picked, setPicked] = useState<{ eventId: string; marketId: string } | null>(null);

  if (!event) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
        Select an event to explore its markets, live order book, and price history.
      </div>
    );
  }

  const multi = event.markets.length > 1;
  const candidates = multi
    ? [...event.markets].sort((a, b) => (yesOutcome(b)?.price ?? 0) - (yesOutcome(a)?.price ?? 0))
    : [];

  const selectedMarket = multi
    ? picked?.eventId === event.id
      ? (event.markets.find((m) => m.id === picked.marketId) ?? null)
      : null
    : (event.markets[0] ?? null);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-zinc-100">{event.title}</h2>
        <div className="tnum flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
          <span>Vol {fmtUsd(event.volume)}</span>
          <span>Liq {fmtUsd(event.liquidity)}</span>
          {event.endDate && <span>ends {new Date(event.endDate).toLocaleDateString()}</span>}
          {event.tags.slice(0, 4).map((tag) => (
            <span key={tag.id || tag.slug} className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-zinc-400">
              {tag.label}
            </span>
          ))}
        </div>
      </header>

      {multi ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,300px)_1fr]">
          <div className="h-fit overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
            <h3 className="border-b border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200">
              Markets ({candidates.length})
            </h3>
            <ul className="flex flex-col">
              {candidates.map((market) => {
                const yes = yesOutcome(market);
                const price = yes?.price ?? 0;
                const active = market.id === selectedMarket?.id;
                return (
                  <li key={market.id}>
                    <button
                      type="button"
                      onClick={() => setPicked({ eventId: event.id, marketId: market.id })}
                      className={[
                        "flex w-full flex-col gap-1 border-b border-zinc-800/70 px-3 py-2.5 text-left transition-colors",
                        active ? "bg-zinc-800/60" : "hover:bg-zinc-800/30",
                      ].join(" ")}
                    >
                      <span className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-zinc-100">{repLabel(market)}</span>
                        <span className="tnum flex-none font-medium text-zinc-100">
                          {(price * 100).toFixed(0)}%
                        </span>
                      </span>
                      <span className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                        <span
                          className="block h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.max(0, Math.min(1, price)) * 100}%` }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {selectedMarket ? (
            <MarketPanel market={selectedMarket} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
              Pick a market to see its live order book and price history.
            </div>
          )}
        </div>
      ) : (
        selectedMarket && <MarketPanel market={selectedMarket} />
      )}
    </div>
  );
}
