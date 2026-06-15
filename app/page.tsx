// Dashboard composition. Placeholder for P1 — the live market list, detail
// panel, order book, chart, and probability readout are wired up in P2.
export default function Page() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">PolyDashboard</h1>
      <p className="text-sm text-zinc-400">
        Rebuilt on a CORS-safe proxy + live order-book architecture. The data
        layer (lib/pm) and the /api proxy routes are in place; the dashboard UI
        lands in the next build phase.
      </p>
    </main>
  );
}
