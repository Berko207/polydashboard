"use client";

import { useEffect, useMemo, useState } from "react";

import { fmtUsd } from "@/lib/format";
import type { Category } from "@/lib/pm/categories";
import { fetchEvents } from "@/lib/pm/rest";
import type { PMEvent } from "@/lib/pm/types";

interface EventListProps {
  category: Category;
  query: string;
  selectedId: string | null;
  onSelect: (event: PMEvent) => void;
}

/**
 * Discovery rail. Refetches events whenever the active category changes and
 * filters client-side by the search query. Fetched state is tagged with the
 * category key and reconciled during render so a category switch reads as
 * "loading" without flashing the previous category's events.
 */
export function EventList({ category, query, selectedId, onSelect }: EventListProps) {
  const [loaded, setLoaded] = useState<{ key: string; events: PMEvent[] } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchEvents({
      limit: 50,
      order: category.order,
      ascending: category.ascending ?? false,
      tagSlug: category.tagSlug,
    })
      .then((events) => {
        if (!cancelled) setLoaded({ key: category.key, events });
      })
      .catch((err) => {
        if (!cancelled) {
          setError({ key: category.key, message: err instanceof Error ? err.message : String(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [category.key, category.order, category.ascending, category.tagSlug]);

  const events = loaded && loaded.key === category.key ? loaded.events : null;
  const errorMessage = error && error.key === category.key ? error.message : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = events ?? [];
    return q ? list.filter((e) => e.title.toLowerCase().includes(q)) : list;
  }, [events, query]);

  if (errorMessage) {
    return <p className="px-3 py-6 text-sm text-rose-400">Failed to load events: {errorMessage}</p>;
  }
  if (!events) {
    return <p className="px-3 py-6 text-sm text-zinc-500">Loading {category.label.toLowerCase()}…</p>;
  }
  if (filtered.length === 0) {
    return (
      <p className="px-3 py-6 text-sm text-zinc-500">
        {query ? `No events match “${query}”.` : "No events in this category."}
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {filtered.map((event) => {
        const selected = event.id === selectedId;
        const top = event.markets.length === 1 ? event.markets[0].outcomes[0] : null;
        return (
          <li key={event.id}>
            <button
              type="button"
              onClick={() => onSelect(event)}
              className={[
                "flex w-full items-center gap-2.5 border-b border-zinc-800/70 px-3 py-3 text-left transition-colors",
                selected ? "bg-zinc-800/60" : "hover:bg-zinc-800/30",
              ].join(" ")}
            >
              {event.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.image}
                  alt=""
                  className="h-9 w-9 flex-none rounded-md bg-zinc-800 object-cover"
                />
              ) : (
                <div className="h-9 w-9 flex-none rounded-md bg-zinc-800" />
              )}
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="line-clamp-2 text-sm text-zinc-100">{event.title}</span>
                <span className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="tnum">Vol {fmtUsd(event.volume)}</span>
                  {top ? (
                    <span className="tnum text-zinc-300">
                      {top.label} {(top.price * 100).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-zinc-400">{event.markets.length} markets</span>
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
