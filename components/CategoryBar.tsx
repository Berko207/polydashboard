"use client";

import { CATEGORIES, type Category } from "@/lib/pm/categories";

interface CategoryBarProps {
  activeKey: string;
  onSelect: (category: Category) => void;
}

/**
 * Horizontal category nav. Each chip swaps the Gamma `/events` query (tag + sort)
 * driving the event list. Presentational — the active key and selection handler
 * live in the page.
 */
export function CategoryBar({ activeKey, onSelect }: CategoryBarProps) {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/60">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2">
        {CATEGORIES.map((category) => {
          const active = category.key === activeKey;
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => onSelect(category)}
              className={[
                "whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-zinc-100 font-medium text-zinc-900"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200",
              ].join(" ")}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
