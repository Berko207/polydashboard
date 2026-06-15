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
├── MarketList                  # search + volume rank → selects a Market
└── MarketDetail                # hero prob readout + outcome picker
    ├── OrderBook               # live depth ladder, spread, last trade
    └── PriceChart              # SVG sparkline
```

## Live state

`useOrderBook` wraps `lib/pm/ws.ts` (`MarketSocket`):
- subscribe frame on open, ~10s PING keepalive
- apply `book` snapshots, then `price_change` deltas onto the ladder
- exponential-backoff reconnect
- a `live` flag is surfaced to the UI from connection status

## Roadmap (P3 — on top of the live-data core)

- KPI cards: 24h volume, funding rate, Greeks
- Kelly-criterion position calculator (driven by live mid prices)
- Category / timeframe filters
- Icon polish
