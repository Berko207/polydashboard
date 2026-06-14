# PolyDashboard Structure (Expert Trading Dashboard)

## Core Philosophy
Built following `trading-frontend-engineer` and `polymarket-navigator` skills:
- Accuracy first
- Low cognitive load for traders
- Actionable visualizations over raw data
- Strong separation between data layer (Gamma + future CLOB) and presentation

## Current Architecture (v0.2)

- **Tab-based navigation** (Overview / Scanner / Edge Tools / Watchlist)
- Client-side state + localStorage for watchlist
- Gamma API fetching with fallback demo data
- Kelly calculation implemented client-side in modal
- Professional dark theme defined in globals.css

## Recommended Future Navigation & Structure

### Sidebar (Long-term Goal)
- Overview (cross-category edge opportunities)
- Sports (with dedicated subsections for major events)
- Crypto
- Geopolitics / Politics
- Edge Scanner (global advanced table with virtual scrolling)
- Portfolio & Positions
- Watchlist
- Alerts & Signals (X integration)

### Top Bar
- Global search (using Gamma search endpoint)
- Quick category filters + saved filters
- Wallet connection status
- Refresh + last updated
- User profile / settings

## Data Layer Strategy (`polymarket-navigator`)

### Current
- Basic `/events` with volume_min + simple filters

### Next Steps
- Use `tag_slug` heavily (politics, crypto, sports, etc.)
- Implement pagination + infinite scroll / virtualized lists
- Add `/public-search` for better discovery
- Fetch individual market details + CLOB public endpoints for mid price & book
- Add WebSocket layer for live updates where available

## Key Components Roadmap

### Already Good
- Market cards with probability + volume + sparklines
- Detail modal with Kelly sizer
- Watchlist persistence

### High Priority Missing
- Order book depth chart / visualization
- Real probability history line chart (Recharts or Lightweight Charts)
- Portfolio positions table with P&L
- Order placement form (preview + submit to CLOB)
- Category-specific rich views

## State Management
- Current: React useState + useEffect + localStorage
- Recommended next: TanStack Query for server state + caching

## Styling & UX
- Excellent foundation in globals.css
- Next: Component library approach (shadcn/ui style) for trading primitives (OrderBook, ProbabilityGauge, PositionSizer, etc.)

## Authentication & Trading
- Future: Wallet connection (Wagmi/Viem)
- CLOB client integration for authenticated actions
- API key management for builder/relayer if using gasless

## Success Metrics for v1.0
- Can discover high-edge markets quickly
- Can calculate and see recommended position size instantly
- Can view live order book for a market
- Watchlist updates in real time across sessions
- Smooth performance with 100+ markets