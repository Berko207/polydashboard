import { handleProxy } from "@/lib/pm/proxy";

// Server proxy -> CLOB REST (clob.polymarket.com): book snapshots, prices,
// prices-history. Fixes browser CORS.
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  return handleProxy("clob", req);
}
