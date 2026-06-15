import type { Outcome, TokenId } from "@/lib/pm/types";

const asPct = (p: number) => `${(p * 100).toFixed(1)}%`;

// A small fixed palette keyed by outcome index (Yes-ish green, No-ish rose,
// then a few more for multi-outcome markets).
const BAR_COLORS = ["bg-emerald-500", "bg-rose-500", "bg-sky-500", "bg-amber-500", "bg-violet-500"];

interface ProbBarProps {
  outcomes: Outcome[];
  selectedTokenId?: TokenId | null;
  onSelect?: (outcome: Outcome) => void;
  className?: string;
}

/**
 * Probability readout for a market's outcomes. Prices come pre-normalized from
 * lib/pm (Gamma's stringified outcomePrices already parsed and index-aligned to
 * labels/token ids), so this component never parses anything itself.
 *
 * When `onSelect` is provided each row becomes a button that picks the outcome's
 * token id (used to drive the order book / chart in MarketDetail).
 */
export function ProbBar({ outcomes, selectedTokenId, onSelect, className }: ProbBarProps) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      {outcomes.map((outcome, i) => {
        const selected = selectedTokenId != null && outcome.tokenId === selectedTokenId;
        const color = BAR_COLORS[i % BAR_COLORS.length];
        const rowClass = [
          "w-full rounded-md border px-3 py-2 text-left transition-colors",
          selected ? "border-zinc-500 bg-zinc-800/60" : "border-transparent",
          onSelect ? "hover:bg-zinc-800/40 cursor-pointer" : "",
        ].join(" ");

        const inner = (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="truncate text-zinc-200">{outcome.label}</span>
              <span className="tnum ml-2 font-medium text-zinc-100">{asPct(outcome.price)}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: asPct(Math.max(0, Math.min(1, outcome.price))) }}
              />
            </div>
          </>
        );

        return onSelect ? (
          <button key={outcome.tokenId} type="button" className={rowClass} onClick={() => onSelect(outcome)}>
            {inner}
          </button>
        ) : (
          <div key={outcome.tokenId} className={rowClass}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
