"use client";

import { useState } from "react";

import { CategoryBar } from "@/components/CategoryBar";
import { EventDetail } from "@/components/EventDetail";
import { EventList } from "@/components/EventList";
import { Header } from "@/components/Header";
import { DEFAULT_CATEGORY, type Category } from "@/lib/pm/categories";
import type { PMEvent } from "@/lib/pm/types";

/**
 * Dashboard composition. Owns the cross-component UI state — search query, the
 * active category, and the selected event — and wires the pieces together. All
 * data access lives behind lib/pm (REST proxies) and the useOrderBook hook (WS).
 */
export default function Page() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>(DEFAULT_CATEGORY);
  const [selected, setSelected] = useState<PMEvent | null>(null);

  return (
    <div className="flex min-h-screen flex-col">
      <Header query={query} onQueryChange={setQuery} />
      <CategoryBar
        activeKey={category.key}
        onSelect={(next) => {
          setCategory(next);
          setSelected(null);
        }}
      />

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-4 px-4 py-4 lg:grid-cols-[340px_1fr]">
        <aside className="h-fit overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <h2 className="border-b border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200">Events</h2>
          <EventList
            category={category}
            query={query}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        </aside>

        <section>
          <EventDetail event={selected} />
        </section>
      </main>
    </div>
  );
}
