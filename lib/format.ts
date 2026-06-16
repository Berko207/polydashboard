// Tiny display helpers shared across discovery components.

/** Compact USD: $1.2M / $12.3K / $940. */
export const fmtUsd = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

/** Probability in [0,1] → integer percent, e.g. 0.18 → "18%". */
export const fmtPct = (p: number): string => `${(p * 100).toFixed(0)}%`;
