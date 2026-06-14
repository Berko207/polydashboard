# PolyDashboard

**Professional real-time trading intelligence dashboard for Polymarket prediction markets.**

Built for serious traders who want edge discovery, probability visualization, position sizing, and watchlist management — all in one clean, fast interface.

![PolyDashboard](https://polydashboard.vercel.app) <!-- Update with actual screenshot -->

## ✨ Key Features

- **Live Market Scanner** — Filter by volume, liquidity, category, search. Sort by volume, liquidity or ending soon.
- **Overview Dashboard** — At-a-glance KPIs and top opportunity cards with probability sparklines.
- **Powerful Edge Tools** — Interactive Kelly Criterion position sizer (with half-Kelly risk management).
- **Rich Detail Modals** — Full market info, resolution source, probability trajectory, and **personalized Kelly sizing** per market.
- **Watchlist** — Star markets and persist them across sessions (localStorage).
- **Real-time Data** — Fetches from official Polymarket Gamma API every 60 seconds. Graceful demo fallback.
- **Professional Trading UI** — Deep dark theme, Geist typography, smooth animations (Framer Motion), responsive design.

## 🛠 Tech Stack

- **Next.js 16** + React 19 + TypeScript
- **Tailwind CSS 4** + custom trading-optimized design system
- **shadcn/ui-inspired** components & patterns
- **Framer Motion** for delightful interactions
- **date-fns** + **lucide-react** icons
- **Vercel** deployment

Data powered by [Polymarket Gamma API](https://gamma-api.polymarket.com) (public, no auth required for market discovery).

## 🚀 Quick Start

```bash
git clone https://github.com/Berko207/polydashboard.git
cd polydashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables (for future authenticated features)

Create `.env.local`:

```env
# Future: CLOB API credentials for live trading
# POLYMARKET_PRIVATE_KEY=0x...
# CLOB_API_KEY=...
```

## 📊 How It Works

1. **Data Layer**: Uses Polymarket’s public Gamma API for events & markets (inspired by `polymarket-navigator` patterns).
2. **Edge Calculation**: Kelly formula implemented client-side for instant feedback.
3. **Persistence**: Watchlist saved locally.
4. **Future-Proof**: Clean architecture ready for wallet connection (Wagmi + Viem), CLOB trading, X/Twitter signals, and user accounts.

## 🛠 Roadmap / Future Enhancements

- [ ] Real wallet connection + on-chain position tracking
- [ ] Live order book & CLOB integration (using `clob-client-v2` or unified SDK)
- [ ] Category-specific views (Sports, Crypto, Politics, Geopolitics)
- [ ] X (Twitter) signal scanner for sentiment/Elon mentions
- [ ] Alerts & notifications
- [ ] Backtesting / historical probability charts
- [ ] Multi-outcome market support & advanced analytics

## 📁 Project Structure

```
polydashboard/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Main dashboard (tabs + logic)
│   └── globals.css         # Professional trading dark theme
├── docs/                   # Planning & architecture docs
├── package.json
└── vercel.json
```

## 🤝 Contributing

This is a personal trading tool. PRs and ideas welcome — especially around:
- Better visualizations
- New data sources
- Risk management improvements

Run `npm run lint` before submitting.

## 📋 License

MIT — Use freely for your own trading edge.

---

**Built with ❤️ for prediction market traders.**

*Data is for informational purposes only. Always do your own research and manage risk responsibly.*