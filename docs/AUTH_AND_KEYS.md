# Authentication & API Keys Plan

## Google Login
Recommended: Use **Clerk** (easiest integration in Next.js)

Benefits:
- Google OAuth in < 10 minutes
- User management + metadata storage
- Secure session handling

Alternative: NextAuth.js v5

## Polymarket API Keys / Trading Access

### Recommended Approach
1. **Primary**: Wallet connection using Wagmi + Viem (best for Polymarket CLOB)
2. **Secondary**: Allow users to paste CLOB API key in Settings (encrypted)

### Security Rules
- Never store private keys in plain text
- Use Clerk `privateMetadata` or encrypted localStorage
- Short-lived tokens only
- Clear warnings in UI

## Implementation Steps
1. Add Clerk to the project
2. Create Settings modal for API keys / wallet connection
3. Store watchlist and preferences per user
4. Add protected routes for trading features

## Current Status
- Placeholder ready in UI
- Full implementation planned next