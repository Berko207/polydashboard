# PolyDashboard Structure

Connector-backed, read-only dashboard. The browser never calls Polymarket
directly — all REST reads go through a server-side proxy.

## Data flow

```
Browser (components + useOrderBook)
   │  fetch /api/gamma | /api/clob | /api/data        ← REST, CORS-safe
   ▼
Next.js route handlers  →  lib/pm/proxy (server-only) ──► upstream Polymarket APIs
                                                            (gamma / clob / data)

Browser  ── WebSocket (CORS-exempt) ──► Polymarket market channel  (live book)
```

REST goes through the proxy; the live order book connects to the Polymarket
WebSocket directly (WS is exempt from CORS).

## Component tree

```
App (app/page.tsx)
├── Header                      # search query
├── CategoryBar                 # curated tag/sort tabs (lib/pm/categories)
├── EventList                   # /events for the active category → selects a PMEvent
└── EventDetail                 # event header + tags
    ├── (grouped event)         # ranked list of constituent markets → pick one
    └── MarketPanel             # outcome picker for the selected market
        ├── ProbBar             # per-outcome probabilities
        ├── PriceChart          # SVG sparkline
        └── OrderBook           # live depth ladder, spread, mid
```

Discovery is **event-first**: Gamma `/events` groups markets under a theme
(e.g. "World Cup Winner" → one market per team). Single-market events render the
trading panel directly; grouped events rank their legs by implied ("Yes")
probability and drill into a live book + chart on selection.

## Live state

`useOrderBook` wraps `lib/pm/ws.ts` (`MarketSocket`):
- subscribe frame on open, ~10s PING keepalive
- apply `book` snapshots, then `price_change` deltas onto the ladder
- exponential-backoff reconnect
- a `live` flag is surfaced to the UI from connection status

## Roadmap (P3 — on top of the live-data core)

- KPI cards: 24h volume, funding rate, Greeks
- Kelly-criterion position calculator (driven by live mid prices)
- ~~Category filters~~ ✅ done — `CategoryBar` + event-first discovery
- Pagination / infinite scroll for events; richer subcategory chips
- Timeframe filters; live Gamma `/public-search` instead of client-side filter
- Icon polish
