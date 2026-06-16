# Authentication & API Keys

## Current state: demo-safe

No authentication, no trading, no secrets. The dashboard is read-only.

## Read-only access (today)

- The browser needs **no secrets**. It only talks to our own `/api/*` proxy
  routes and the public Polymarket WebSocket.
- The Vercel proxy makes **standard outbound internet** GET requests to
  Polymarket's REST hosts. No Polymarket API keys are required for reads.

## Live trading (later phases)

Trading will require a **server-side signing layer**, never the browser:

- Order signing / execution via `py-clob-client-v2`, run on Fly.io.
- State (positions, orders, preferences) in Supabase.
- All secrets — signing keys, Supabase service credentials — stay server-side
  and out of the client bundle.

User auth (e.g. wallet connect or an OAuth provider) is deferred to those
phases and is not needed for the current read-only dashboard.
