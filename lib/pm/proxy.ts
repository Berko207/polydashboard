// SERVER-ONLY. The upstream Polymarket base URLs live ONLY in this file.
//
// Why this exists: browsers cannot fetch Polymarket's REST APIs directly because
// the responses lack permissive CORS headers. Every browser-side request must go
// through one of the /app/api/* route handlers, which call into this helper. If
// you import this module from a Client Component you defeat that, leak the
// upstream URLs into the client bundle, and reintroduce the CORS failures.
//
// WebSockets are exempt from CORS and connect directly from the client — see
// lib/pm/ws.ts. Do NOT route WS traffic through here.

export type Upstream = "gamma" | "clob" | "data";

const UPSTREAM_BASE: Record<Upstream, string> = {
  gamma: process.env.PM_GAMMA_URL ?? "https://gamma-api.polymarket.com",
  clob: process.env.PM_CLOB_URL ?? "https://clob.polymarket.com",
  data: process.env.PM_DATA_URL ?? "https://data-api.polymarket.com",
};

// Hard guard: this code must never execute in the browser.
if (typeof window !== "undefined") {
  throw new Error("lib/pm/proxy.ts is server-only and must not run in the browser");
}

/**
 * Forward a browser request to its upstream Polymarket API.
 *
 * The browser calls `/api/<upstream>?path=<endpoint>&...params`. We read `path`,
 * strip it, and replay the remaining query string against the upstream base URL.
 * This keeps a single static route file per upstream (no catch-all segments)
 * while supporting any endpoint.
 */
export async function handleProxy(upstream: Upstream, req: Request): Promise<Response> {
  const incoming = new URL(req.url);
  const params = new URLSearchParams(incoming.search);

  const path = params.get("path") ?? "";
  params.delete("path");

  const cleanPath = "/" + path.replace(/^\/+/, "");
  const qs = params.toString();
  const url = `${UPSTREAM_BASE[upstream]}${cleanPath}${qs ? `?${qs}` : ""}`;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    return Response.json(
      { error: "upstream_unreachable", upstream, message: String(err) },
      { status: 502 },
    );
  }

  // Pass the body through untouched; the browser client normalizes it.
  const body = await upstreamRes.text();
  return new Response(body, {
    status: upstreamRes.status,
    headers: {
      "content-type": upstreamRes.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}
