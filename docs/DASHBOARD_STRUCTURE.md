# PolyDashboard Structure (Expert Trading Dashboard)

## Core Philosophy
Built following `trading-frontend-engineer` and `polymarket-navigator` skills:
- Accuracy first
- Low cognitive load
- Actionable visualizations
- Category-specific exploration using Gamma API tags

## Recommended Navigation

### Sidebar
- Overview (cross-category edge opportunities)
- Sports (with dedicated World Cup subsection)
- Crypto
- Geopolitics
- Politics
- Edge Scanner (global sortable table)
- Watchlist
- Elon / X Signals

### Top Bar
- Global search
- Quick category filters
- Refresh
- User profile (Google login ready)

## Data Fetching Strategy (polymarket-navigator)

Use these Gamma API patterns:
- `tag_slug=sports` + special filters for major events (World Cup, NBA Finals, etc.)
- `tag_slug=crypto`
- `tag_slug=geopolitics`
- `tag_slug=politics`
- High volume + liquidity filters by default

## Key Components
- Market cards with probability + volume
- Probability path visualization (SVG)
- Detail modal with Kelly position sizer
- Watchlist with persistence
- Category-specific sections

## Future Enhancements
- Real wallet connection (Wagmi + Viem)
- X/Twitter integration for Elon signals
- User accounts with Clerk or NextAuth
- On-chain position tracking