import { handleProxy } from "@/lib/pm/proxy";

// Server proxy -> Data API (data-api.polymarket.com): positions, holders,
// trades (keyed by condition id). Fixes browser CORS.
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  return handleProxy("data", req);
}
