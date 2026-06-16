import { handleProxy } from "@/lib/pm/proxy";

// Server proxy -> Gamma API (gamma-api.polymarket.com). Fixes browser CORS.
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  return handleProxy("gamma", req);
}
