# PolyDashboard Progress Tracker

## Status — June 2026: connector-backed architecture is canonical

The v0.2/v0.3 "professional UI" monolith is **retired**. That version was a
single large `app/page.tsx` (framer-motion, lucide-react, date-fns,
react-query) with **no server proxy and no connector layer**, so in production
it could only ever render demo/fallback data — the browser is blocked by CORS
from calling Polymarket's REST hosts directly.

The current repo state is the **connector-backed architecture**. It is now
canonical, and **live data flows through the server proxy** rather than through
a browser-side fetch that CORS would reject.

> The retired monolith is preserved on branch `enhance/v0.2-professional-ui`
> as a **design reference**. Do **not** delete that branch — its UI ideas feed
> the P3 backlog below.

---

## P1 — CORS-safe proxy + data core (done)

The browser never talks to Polymarket REST hosts directly. Every request goes
through our own Next.js route handlers, which call into a server-only proxy
helper.

- `app/api/gamma`, `app/api/clob`, `app/api/data` — thin route handlers.
- `lib/pm/proxy.ts` — **server-only**. The upstream Polymarket base URLs live
  here and nowhere else; importing it client-side would leak the URLs into the
  bundle and reintroduce CORS failures. Path allowlist hardens against SSRF.
- `lib/pm/rest.ts` — the browser-side data client. The UI talks **only** to
  this module. It normalizes Gamma's quirks (JSON-encoded string arrays) and
  drops token-less markets.
- `lib/pm/types.ts` — shared shapes, including the **branded `TokenId` /
  `ConditionId`** distinction that prevents the silent identifier-swap bug
  (per-outcome token id vs. per-market condition id).
- `lib/pm/ws.ts` — market-channel WebSocket client (WS is CORS-exempt, so it
  connects directly): subscribe frame, ~10s PING keepalive, `book` snapshots +
  `price_change` deltas, exponential-backoff reconnect.

## P2 — Dashboard UI (done)

Clean, component-based dashboard composed in `app/page.tsx` (owns only the
search query and selected-market state):

- `components/MarketList.tsx` — searchable market list via `fetchMarkets`.
- `components/MarketDetail.tsx` — selected-market detail view.
- `components/OrderBook.tsx` + `hooks/useOrderBook.ts` — **live** order book
  over the WebSocket connector with connection-status surfacing.
- `components/PriceChart.tsx` — price history via `fetchPriceHistory`.
- `components/ProbBar.tsx`, `components/Header.tsx` — presentation primitives.

Dependency surface is deliberately minimal: **next / react / react-dom** only.

---

## P3 — UI features worth re-adding ON TOP of the real connectors

These are proven UI ideas from the retired v0.2 monolith. They are worth
re-adding, but **on top of the live connector layer** (real proxied data + live
WS book), not as the demo-only widgets they were before:

- **Kelly-criterion position-sizing calculator** — edge % and recommended
  fraction, now driven by real mid prices from the connectors.
- **Richer KPI cards** — volume, liquidity, 24h change, spread, computed from
  live data rather than fallback demo values.
- **Category / volume filters** — `tag_slug`-based category filtering plus
  volume/liquidity thresholds and sorting on the market list.
- **Iconography** — reintroduce icons where they aid scanning. Only pull in an
  icon dependency (e.g. lucide-react) if/when this is actually built; do not
  add it speculatively.

### Dependency policy

Keep the dependency surface minimal. Do **not** reintroduce framer-motion,
lucide-react, date-fns, or react-query unless a concrete P3 feature genuinely
needs it — and add it as part of that feature, not ahead of it.

---

## References
- `polymarket-navigator` skill — data fetching patterns.
- `trading-frontend-engineer` skill — trading UI/UX components.

## Notes
- Active development happens on the connector-backed line (this branch),
  destined to become `main`.
- `enhance/v0.2-professional-ui` is kept as a design reference only.
- Prioritize trader cognitive load and risk awareness in every feature.
