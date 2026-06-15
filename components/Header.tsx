interface HeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
}

/** Top bar: brand + market search. Presentational; search state lives in page. */
export function Header({ query, onQueryChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-zinc-100">PolyDashboard</span>
          <span className="hidden text-xs text-zinc-500 sm:inline">Polymarket CLOB V2</span>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search markets…"
          className="ml-auto w-full max-w-xs rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
      </div>
    </header>
  );
}
