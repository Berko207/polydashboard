# PolyDashboard

**Real-time, read-only intelligence dashboard for Polymarket prediction markets.**

Live market discovery, probability readouts, and a live order book — served
through a CORS-safe server proxy so the browser always gets real data.

**Live Demo:** [https://polydashboard.vercel.app](https://polydashboard.vercel.app)

## How it works

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript.

**Proxy routes** — `/api/gamma`, `/api/clob`, `/api/data`. The browser cannot
read Polymarket's REST hosts directly (no permissive CORS headers), so all
reads go through these server-side route handlers. Upstream base URLs live only
on the server; a path allowlist guards against SSRF.

**`lib/pm` core:**
- Branded `TokenId` / `ConditionId` types so the per-outcome token id and the
  per-market condition id can't be silently swapped.
- Defensive Gamma parsing (its JSON-encoded string arrays are normalized; markets
  without tokens are dropped).
- A live WebSocket `MarketSocket` (CORS-exempt) for order-book snapshots and
  `price_change` deltas, with PING keepalive and exponential-backoff reconnect.

**Components:**
- `MarketList` — search + volume ranking.
- `MarketDetail` — hero probability readout and outcome picker.
- `OrderBook` — live depth ladder, spread, last trade.
- `PriceChart` — SVG price sparkline.

**Deployment:** Vercel. The proxy routes run as serverless functions and scale
automatically. Read-only access needs **zero secrets** — no Polymarket API keys
are required for GET traffic.

## Quick Start

```bash
git clone https://github.com/Berko207/polydashboard.git
cd polydashboard
npm install
npm run dev
```

## Project Structure

```
polydashboard/
├── app/
│   ├── api/{gamma,clob,data}/    # CORS-safe server proxy routes
│   ├── layout.tsx
│   ├── page.tsx                  # dashboard composition
│   └── globals.css
├── components/                   # MarketList, MarketDetail, OrderBook, PriceChart, ...
├── hooks/useOrderBook.ts         # live WS book hook
├── lib/pm/                       # proxy, rest, types, ws (data core)
├── docs/                         # architecture & planning
└── package.json
```

## Note on v0.2

The earlier v0.2 monolith (tabs, watchlist, Kelly calculator) is archived on
branch `enhance/v0.2-professional-ui` as a design reference. Its UX features are
slated for **P3**, to be re-added on top of this live-data core (see
`docs/PROGRESS.md`).

## License

MIT

---

*Not financial advice. Trade responsibly.*
