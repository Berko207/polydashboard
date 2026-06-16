"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchPriceHistory } from "@/lib/pm/rest";
import type { PricePoint, TokenId } from "@/lib/pm/types";

// viewBox units; the SVG scales to its container via width=100%.
const W = 100;
const H = 32;
const PAD_Y = 2;

function buildPath(points: PricePoint[]): { line: string; area: string; lo: number; hi: number } {
  const prices = points.map((p) => p.p);
  let lo = Math.min(...prices);
  let hi = Math.max(...prices);
  if (lo === hi) {
    lo -= 0.01;
    hi += 0.01;
  }
  const n = points.length;
  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (p: number) => PAD_Y + (1 - (p - lo) / (hi - lo)) * (H - 2 * PAD_Y);

  const line = points.map((pt, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(pt.p).toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return { line, area, lo, hi };
}

/**
 * Price history for a single outcome token. NOTE: the underlying CLOB endpoint's
 * `market` param takes the TOKEN id — handled inside lib/pm/rest. Rendered as a
 * dependency-free SVG sparkline auto-scaled to the data's price range.
 */
export function PriceChart({ tokenId }: { tokenId: TokenId | null }) {
  // State is tagged with its token so a token switch reads as "loading" during
  // render without a synchronous reset inside the effect.
  const [result, setResult] = useState<{ tokenId: TokenId; points: PricePoint[] } | null>(null);
  const [error, setError] = useState<{ tokenId: TokenId; message: string } | null>(null);

  useEffect(() => {
    if (!tokenId) return;
    let cancelled = false;
    fetchPriceHistory(tokenId, { interval: "1w", fidelity: 60 })
      .then((data) => {
        if (!cancelled) setResult({ tokenId, points: data });
      })
      .catch((err) => {
        if (!cancelled) setError({ tokenId, message: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  const points = result && result.tokenId === tokenId ? result.points : null;
  const errorMessage = error && error.tokenId === tokenId ? error.message : null;
  const chart = useMemo(() => (points && points.length > 1 ? buildPath(points) : null), [points]);
  const last = points && points.length > 0 ? points[points.length - 1].p : null;

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/40">
      <header className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <h3 className="text-sm font-medium text-zinc-200">Price history</h3>
        {last != null && <span className="tnum text-xs text-zinc-300">{(last * 100).toFixed(1)}%</span>}
      </header>

      <div className="p-3">
        {!tokenId ? (
          <p className="py-6 text-center text-xs text-zinc-500">Select an outcome.</p>
        ) : errorMessage ? (
          <p className="py-6 text-center text-xs text-rose-400">{errorMessage}</p>
        ) : !points ? (
          <p className="py-6 text-center text-xs text-zinc-500">Loading history…</p>
        ) : !chart ? (
          <p className="py-6 text-center text-xs text-zinc-500">Not enough data.</p>
        ) : (
          <div className="flex flex-col gap-1">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-28 w-full">
              <path d={chart.area} fill="rgb(16 185 129 / 0.12)" />
              <path d={chart.line} fill="none" stroke="rgb(16 185 129)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="tnum flex justify-between text-[10px] text-zinc-500">
              <span>lo {(chart.lo * 100).toFixed(1)}%</span>
              <span>hi {(chart.hi * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
