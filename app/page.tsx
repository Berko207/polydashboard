"use client";

import { useState } from "react";

import { Header } from "@/components/Header";
import { MarketDetail } from "@/components/MarketDetail";
import { MarketList } from "@/components/MarketList";
import type { Market } from "@/lib/pm/types";

/**
 * Dashboard composition. Owns only the cross-component UI state — the search
 * query and the selected market — and wires the pieces together. All data access
 * lives behind lib/pm (REST proxies) and the useOrderBook hook (WS).
 */
export default function Page() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Market | null>(null);

  return (
    <div className="flex min-h-screen flex-col">
      <Header query={query} onQueryChange={setQuery} />

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-4 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <h2 className="border-b border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200">Markets</h2>
          <MarketList query={query} selectedId={selected?.id ?? null} onSelect={setSelected} />
        </aside>

        <section>
          <MarketDetail market={selected} />
        </section>
      </main>
    </div>
  );
}
