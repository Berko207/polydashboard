# PolyDashboard

**Professional real-time trading intelligence dashboard for Polymarket prediction markets.**

Built for serious traders who want edge discovery, probability visualization, position sizing, and watchlist management — all in one clean, fast interface.

**Live Demo:** [https://polydashboard.vercel.app](https://polydashboard.vercel.app)

## Current Status (v0.2)

### What's Working Well
- Clean professional dark trading theme with Geist fonts
- Live data from Polymarket Gamma API (with demo fallback)
- Tab-based navigation (Overview, Scanner, Edge Tools, Watchlist)
- Advanced filtering + sorting in Scanner
- Probability sparklines and KPI cards
- **Full Kelly Criterion position sizer** in market detail modal
- Watchlist with localStorage persistence
- Smooth animations and good responsive cards
- Strong foundation aligned with `trading-frontend-engineer` and `polymarket-navigator` skills

### Known Issues on Live Site
- Live data sometimes shows 0 values (likely API fetch / CORS / rate limit in production) — falls back inconsistently
- Limited multi-outcome support
- No real-time order book or CLOB data yet
- Basic simulated probability history

## ✨ Key Features (Implemented)

- Market discovery & scanner powered by Gamma API
- Interactive Kelly calculator with edge calculation
- Rich market detail modals
- Persistent watchlist
- Professional UI components ready for expansion

## What's Still Missing (High Priority for Future Development)

We are still missing core pieces to make this a **complete production-grade trading frontend**. The following areas need work, drawing from the `polymarket-navigator` and `trading-frontend-engineer` skills:

### 1. Data Layer & Polymarket Integration (`polymarket-navigator`)
- Better structured use of Gamma API (tag_slug filters, pagination, search endpoint, end_date ranges)
- Full support for multi-outcome events and nested markets
- Integration with CLOB public endpoints for live mid prices and basic order book snapshots
- WebSocket / better real-time updates (instead of 60s polling)
- Historical probability / price data for sparklines and backtesting

### 2. Trading & Execution Layer (`trading-frontend-engineer`)
- Wallet connection (Wagmi + Viem or Privy)
- Full CLOB client integration (`@polymarket/clob-client-v2` or unified SDK) for viewing live order books and placing orders
- Order placement UI (limit + market orders) with preview and risk checks
- Portfolio / Positions tracking with real or simulated P&L
- Order management (open orders, cancel)

### 3. Advanced Visualizations & Analytics
- Proper probability history charts (Recharts or Lightweight Charts)
- Order book depth visualization
- Edge opportunity scoring across many markets
- Category-specific dashboards (Politics, Crypto, Sports, Geopolitics)
- X/Twitter sentiment signals integration

### 4. Risk & Position Management
- Advanced Kelly variants + position sizing recommendations
- Portfolio risk overview (exposure by category/outcome)
- Stop-loss / take-profit simulation
- Bankroll management tools

### 5. UX & Production Readiness
- Better error states, loading skeletons, and empty states
- Mobile-first responsive improvements + drawer navigation
- Accessibility (ARIA, keyboard nav)
- Authentication (Clerk / NextAuth) for saved preferences
- Alerts & push notifications for watched markets
- Performance: Virtualized lists for large market sets

### 6. Developer Experience & Architecture
- Proper TypeScript types shared with `polymarket-navigator`
- Environment variable management for CLOB keys
- Testing (unit + integration for Kelly math and API)
- Storybook or component library for trading primitives

## 🛠 Tech Stack

- **Next.js 16** + React 19 + TypeScript
- **Tailwind CSS 4** + custom trading-optimized design system
- **Framer Motion**, **lucide-react**, **date-fns**
- Future: TanStack Query, Recharts / Lightweight Charts, Wagmi/Viem, CLOB SDK

## 🚀 Quick Start (Development)

```bash
git clone https://github.com/Berko207/polydashboard.git
git checkout enhance/v0.2-professional-ui
cd polydashboard
npm install
npm run dev
```

## Roadmap Priorities

1. Fix live data loading in production + add proper error handling
2. Add CLOB read-only integration (live prices + basic order book)
3. Implement wallet connection stub + simulated trading
4. Add real probability history charts
5. Expand to category-specific views using `polymarket-navigator` patterns
6. Full order placement flow

## Project Structure

```
polydashboard/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # Main dashboard logic
│   └── globals.css              # Trading theme
├── docs/                        # Architecture & planning
├── package.json
└── vercel.json
```

## Contributing & Future Development

This project follows principles from:
- `polymarket-navigator` skill (structured Gamma API exploration)
- `trading-frontend-engineer` skill (production trading UI patterns)

When adding features, prioritize:
- Low cognitive load for traders
- Actionable visualizations
- Risk-aware interactions

Run `npm run lint` before committing.

## License

MIT

---

**Built with ❤️ for prediction market traders.**

*Not financial advice. Trade responsibly.*