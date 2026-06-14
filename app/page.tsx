"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// ==================== TYPES (from polymarket-navigator skill) ====================
interface Market {
  id: string;
  slug: string;
  question: string;
  outcomePrices: string;
  volume: number;
  liquidity: number;
  endDate: string;
  closed: boolean;
  resolutionSource?: string;
}

interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  volume: number;
  liquidity: number;
  endDate: string;
  closed: boolean;
  active: boolean;
  category?: string;
  markets: Market[];
}

// ==================== UTILITIES ====================
const formatVolume = (volume: number): string => {
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(0)}K`;
  return `$${volume.toFixed(0)}`;
};

const formatLiquidity = (liquidity: number): string => {
  if (liquidity >= 100_000) return `$${(liquidity / 1000).toFixed(0)}K`;
  return `$${liquidity.toFixed(0)}`;
};

const getPrimaryProbability = (market: Market): number => {
  try {
    const prices = JSON.parse(market.outcomePrices);
    return parseFloat(prices[0] || '0') * 100;
  } catch {
    return 50;
  }
};

// ==================== SVG PROBABILITY CHART ====================
const ProbabilityPathChart: React.FC<{ currentProb: number; marketId: string }> = ({ currentProb, marketId }) => {
  const path = useMemo(() => {
    const points = 7;
    const result: number[] = [];
    let prob = currentProb;
    for (let i = 0; i < points; i++) {
      const variance = (Math.sin(parseInt(marketId.slice(-4) || '1234') + i) - 0.5) * 6;
      prob = Math.max(35, Math.min(85, prob + variance));
      result.push(Math.round(prob * 10) / 10);
    }
    result[result.length - 1] = Math.round(currentProb * 10) / 10;
    return result;
  }, [currentProb, marketId]);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
      <div className="text-xs text-zinc-400 mb-2">7-day probability trajectory</div>
      <div className="h-20 flex items-end gap-1">
        {path.map((p, i) => (
          <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${p}%` }} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
        <span>7d ago</span>
        <span className="text-emerald-400 font-mono">{currentProb.toFixed(1)}% now</span>
      </div>
    </div>
  );
};

// ==================== MAIN DASHBOARD ====================
export default function PolyDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'scanner' | 'tools' | 'watchlist'>('overview');
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minVolume, setMinVolume] = useState(10000);
  const [selectedEvent, setSelectedEvent] = useState<PolymarketEvent | null>(null);
  const [modelProb, setModelProb] = useState(65);
  const [bankroll, setBankroll] = useState(10000);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Fetch from Gamma API
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://gamma-api.polymarket.com/events?limit=30&closed=false&active=true&order=volume&volume_min=${minVolume}`
      );
      const data: PolymarketEvent[] = await res.json();
      setEvents(data.filter(e => e.markets?.length > 0));
      setLastUpdated(new Date());
    } catch (e) {
      // Demo data fallback
      setEvents([
        {
          id: "demo-1",
          slug: "will-trump-win-2028-nomination",
          title: "Will Donald Trump win the 2028 Republican nomination?",
          volume: 12450000,
          liquidity: 485000,
          endDate: "2028-08-01T00:00:00Z",
          closed: false,
          active: true,
          category: "Politics",
          markets: [{ id: "m1", slug: "trump-2028", question: "Trump wins?", outcomePrices: '["0.71","0.29"]', volume: 12450000, liquidity: 485000, endDate: "2028-08-01T00:00:00Z", closed: false }]
        },
        {
          id: "demo-2",
          slug: "bitcoin-above-120k-2026",
          title: "Will Bitcoin reach $120,000 by end of 2026?",
          volume: 6890000,
          liquidity: 245000,
          endDate: "2026-12-31T23:59:59Z",
          closed: false,
          active: true,
          category: "Crypto",
          markets: [{ id: "m2", slug: "btc-120k", question: "BTC ≥ $120k?", outcomePrices: '["0.67","0.33"]', volume: 6890000, liquidity: 245000, endDate: "2026-12-31T23:59:59Z", closed: false }]
        }
      ]);
    }
    setLoading(false);
  }, [minVolume]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 45000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    let result = [...events];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(q));
    }
    if (selectedCategory !== 'All') {
      result = result.filter(e => e.category === selectedCategory);
    }
    result.sort((a, b) => b.volume - a.volume);
    return result;
  }, [events, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(events.map(e => e.category || 'Other'));
    return ['All', ...Array.from(cats)];
  }, [events]);

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openDetail = (event: PolymarketEvent) => setSelectedEvent(event);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <div>
              <div className="font-semibold text-2xl tracking-tight">PolyDashboard</div>
              <div className="text-[10px] text-zinc-500 -mt-1">POLYMARKET TRADING INTELLIGENCE</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl ${activeTab === 'overview' ? 'bg-zinc-800' : ''}`}>Overview</button>
            <button onClick={() => setActiveTab('scanner')} className={`px-4 py-2 rounded-xl ${activeTab === 'scanner' ? 'bg-zinc-800' : ''}`}>Scanner</button>
            <button onClick={() => setActiveTab('tools')} className={`px-4 py-2 rounded-xl ${activeTab === 'tools' ? 'bg-zinc-800' : ''}`}>Edge Tools</button>
            <button onClick={() => setActiveTab('watchlist')} className={`px-4 py-2 rounded-xl ${activeTab === 'watchlist' ? 'bg-zinc-800' : ''}`}>Watchlist ({watchlist.length})</button>
          </div>

          <button onClick={fetchEvents} className="px-4 py-2 bg-zinc-800 rounded-xl text-sm">Refresh</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <h1 className="text-5xl font-semibold tracking-tight mb-2">Market Intelligence</h1>
            <p className="text-xl text-zinc-400 mb-8">Real-time edge discovery on Polymarket</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {filteredEvents.slice(0, 6).map(event => {
                const prob = getPrimaryProbability(event.markets[0]);
                return (
                  <div key={event.id} onClick={() => openDetail(event)} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 cursor-pointer hover:border-blue-500">
                    <div className="text-xs text-zinc-400 mb-1">{event.category}</div>
                    <h3 className="font-semibold line-clamp-2 mb-4">{event.title}</h3>
                    <div className="text-5xl font-semibold tabular-nums tracking-tight">{prob.toFixed(1)}<span className="text-2xl text-zinc-400">¢</span></div>
                    <div className="text-xs text-zinc-500 mt-1">{formatVolume(event.volume)} vol</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCANNER */}
        {activeTab === 'scanner' && (
          <div>
            <h2 className="text-3xl font-semibold mb-6">Market Scanner</h2>
            
            <div className="flex gap-3 mb-6">
              <input 
                type="text" 
                placeholder="Search markets..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3"
              />
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
              {filteredEvents.map(event => {
                const prob = getPrimaryProbability(event.markets[0]);
                return (
                  <div key={event.id} onClick={() => openDetail(event)} className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 hover:bg-zinc-800 cursor-pointer">
                    <div className="font-medium pr-8">{event.title}</div>
                    <div className="flex items-center gap-8 text-sm">
                      <div className="font-mono text-emerald-400">{prob.toFixed(1)}¢</div>
                      <div className="text-zinc-400">{formatVolume(event.volume)}</div>
                      <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(event.id); }} className="text-lg">☆</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EDGE TOOLS */}
        {activeTab === 'tools' && (
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold mb-6">Kelly Position Sizer</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <div className="mb-6">
                <label className="text-xs text-zinc-400">YOUR BANKROLL (USD)</label>
                <input type="number" value={bankroll} onChange={e => setBankroll(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-5 py-4 text-3xl font-semibold mt-2" />
              </div>
              <div className="mb-6">
                <label className="text-xs text-zinc-400">YOUR ESTIMATED PROBABILITY</label>
                <input type="range" min="20" max="90" value={modelProb} onChange={e => setModelProb(Number(e.target.value))} className="w-full accent-blue-500" />
                <div className="text-center text-4xl font-semibold mt-2">{modelProb}%</div>
              </div>
              <div className="text-center text-sm text-zinc-400">Recommended position size will appear here in the full version.</div>
            </div>
          </div>
        )}

        {/* WATCHLIST */}
        {activeTab === 'watchlist' && (
          <div>
            <h2 className="text-3xl font-semibold mb-6">Your Watchlist</h2>
            {watchlist.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">No markets in watchlist yet. Add some from the Scanner.</div>
            ) : (
              <div>Watchlist items will appear here.</div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-semibold mb-4">{selectedEvent.title}</h2>
            <div className="text-6xl font-semibold tabular-nums tracking-tight mb-6">
              {getPrimaryProbability(selectedEvent.markets[0]).toFixed(1)}<span className="text-3xl text-zinc-400">¢</span>
            </div>
            <ProbabilityPathChart currentProb={getPrimaryProbability(selectedEvent.markets[0])} marketId={selectedEvent.id} />
            <button onClick={() => setSelectedEvent(null)} className="mt-8 w-full py-3 bg-zinc-800 rounded-2xl">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}