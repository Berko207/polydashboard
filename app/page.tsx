"use client";

import React, { useState, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  RefreshCw, Search, Star, StarOff, TrendingUp, Target, Clock, 
  DollarSign, BarChart3 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

// ==================== TYPES ====================
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
  resolutionSource?: string;
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
    return parseFloat(prices[0] || '0.5') * 100;
  } catch {
    return 50;
  }
};

const calculateKelly = (yourProb: number, marketProb: number, bankroll: number, fractional: number = 0.5) => {
  const b = (100 - marketProb) / marketProb;
  const p = yourProb / 100;
  const q = 1 - p;
  const kelly = (b * p - q) / b;
  const recommended = Math.max(0, kelly * fractional * bankroll);
  return {
    kellyFraction: Math.max(0, kelly),
    recommendedSize: recommended,
    edge: (p - marketProb / 100) * 100,
  };
};

// ==================== PROBABILITY SPARKLINE ====================
const ProbabilitySparkline: React.FC<{ currentProb: number; marketId: string }> = ({ currentProb, marketId }) => {
  const points = React.useMemo(() => {
    const result: number[] = [];
    let prob = currentProb;
    for (let i = 0; i < 12; i++) {
      const variance = (Math.sin(parseInt(marketId.slice(-5) || '98765') + i * 1.3) - 0.5) * 8;
      prob = Math.max(25, Math.min(92, prob + variance));
      result.push(Math.round(prob));
    }
    result[result.length - 1] = Math.round(currentProb);
    return result;
  }, [currentProb, marketId]);

  const max = Math.max(...points);
  const min = Math.min(...points);

  return (
    <div className="h-10 flex items-end gap-px bg-zinc-950/50 rounded px-1">
      {points.map((p, i) => {
        const height = ((p - min) / (max - min || 1)) * 100;
        return (
          <div 
            key={i} 
            className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all" 
            style={{ height: `${Math.max(8, height)}%` }} 
          />
        );
      })}
    </div>
  );
};

// ==================== DATA FETCHING ====================
const fetchEvents = async (minVolume: number, minLiquidity: number, sortBy: string): Promise<PolymarketEvent[]> => {
  const params = new URLSearchParams({
    limit: '40',
    closed: 'false',
    active: 'true',
    order: sortBy === 'endDate' ? 'endDate' : 'volume',
    ascending: sortBy === 'endDate' ? 'true' : 'false',
    volume_min: minVolume.toString(),
  });

  const res = await fetch(`https://gamma-api.polymarket.com/events?${params}`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch markets from Polymarket');
  }

  const data: PolymarketEvent[] = await res.json();
  
  return data
    .filter(e => e.markets?.length > 0 && e.liquidity >= minLiquidity)
    .slice(0, 35);
};

// ==================== MAIN DASHBOARD ====================
export default function PolyDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'scanner' | 'tools' | 'watchlist'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minVolume, setMinVolume] = useState(25000);
  const [minLiquidity, setMinLiquidity] = useState(10000);
  const [selectedEvent, setSelectedEvent] = useState<PolymarketEvent | null>(null);
  const [modelProb, setModelProb] = useState(62);
  const [bankroll, setBankroll] = useState(25000);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'volume' | 'liquidity' | 'endDate'>('volume');

  // Load watchlist from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('polydashboard-watchlist');
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);

  const updateWatchlist = (newWatchlist: string[]) => {
    setWatchlist(newWatchlist);
    localStorage.setItem('polydashboard-watchlist', JSON.stringify(newWatchlist));
  };

  const toggleWatchlist = (id: string) => {
    const newList = watchlist.includes(id) 
      ? watchlist.filter(x => x !== id) 
      : [...watchlist, id];
    updateWatchlist(newList);
  };

  // TanStack Query for events
  const { 
    data: events = [], 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey: ['events', minVolume, minLiquidity, sortBy],
    queryFn: () => fetchEvents(minVolume, minLiquidity, sortBy),
    staleTime: 45 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Filtered events
  const filteredEvents = useMemo(() => {
    let result = [...events];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.category?.toLowerCase().includes(q)
      );
    }
    
    if (selectedCategory !== 'All') {
      result = result.filter(e => e.category === selectedCategory);
    }
    
    if (sortBy === 'volume') {
      result.sort((a, b) => b.volume - a.volume);
    } else if (sortBy === 'liquidity') {
      result.sort((a, b) => b.liquidity - a.liquidity);
    } else if (sortBy === 'endDate') {
      result.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    }
    
    return result;
  }, [events, searchQuery, selectedCategory, sortBy]);

  const categories = useMemo(() => {
    const cats = new Set(events.map(e => e.category || 'Other'));
    return ['All', ...Array.from(cats).sort()];
  }, [events]);

  const kpiStats = useMemo(() => {
    const totalVol = events.reduce((sum, e) => sum + e.volume, 0);
    const highLiq = events.filter(e => e.liquidity > 200000).length;
    return {
      totalVolume: formatVolume(totalVol),
      activeMarkets: events.length,
      highLiquidity: highLiq,
    };
  }, [events]);

  const openDetail = (event: PolymarketEvent) => setSelectedEvent(event);
  const closeDetail = () => setSelectedEvent(null);

  const selectedMarket = selectedEvent?.markets[0];
  const marketProb = selectedMarket ? getPrimaryProbability(selectedMarket) : 50;
  const kellyResult = selectedMarket 
    ? calculateKelly(modelProb, marketProb, bankroll) 
    : null;

  // Demo data for when API fails completely
  const demoEvents: PolymarketEvent[] = React.useMemo(() => [
    {
      id: "demo-politics-1",
      slug: "will-trump-win-2028-nomination",
      title: "Will Donald Trump win the 2028 Republican presidential nomination?",
      volume: 18750000,
      liquidity: 1250000,
      endDate: "2028-07-15T00:00:00Z",
      closed: false,
      active: true,
      category: "Politics",
      markets: [{ id: "m1", slug: "trump-2028", question: "Trump wins nomination?", outcomePrices: '["0.68","0.32"]', volume: 18750000, liquidity: 1250000, endDate: "2028-07-15T00:00:00Z", closed: false }],
      resolutionSource: "Republican National Convention / official party announcement"
    },
    {
      id: "demo-crypto-1",
      slug: "bitcoin-above-150k-end-2026",
      title: "Will Bitcoin reach $150,000 by December 31, 2026?",
      volume: 9450000,
      liquidity: 680000,
      endDate: "2026-12-31T23:59:59Z",
      closed: false,
      active: true,
      category: "Crypto",
      markets: [{ id: "m2", slug: "btc-150k", question: "BTC ≥ $150k by EOY 2026?", outcomePrices: '["0.41","0.59"]', volume: 9450000, liquidity: 680000, endDate: "2026-12-31T23:59:59Z", closed: false }],
      resolutionSource: "CoinGecko / CoinMarketCap price at 23:59:59 UTC on Dec 31, 2026"
    }
  ], []);

  const displayEvents = events.length > 0 ? filteredEvents : demoEvents;
  const isUsingDemo = events.length === 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-blue-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl tracking-[-1.5px]">P</span>
            </div>
            <div>
              <div className="font-semibold text-2xl tracking-[-0.5px]">PolyDashboard</div>
              <div className="text-[10px] text-zinc-500 -mt-1.5 font-mono">TRADING INTELLIGENCE</div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-zinc-900 rounded-2xl p-1 text-sm">
            {[ 
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'scanner', label: 'Scanner', icon: Target },
              { id: 'tools', label: 'Edge Tools', icon: TrendingUp },
              { id: 'watchlist', label: `Watchlist (${watchlist.length})`, icon: Star }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-1.5 rounded-xl transition-all ${activeTab === tab.id 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-sm">
            {isUsingDemo && (
              <div className="text-xs px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full">Demo Mode</div>
            )}
            <button 
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-2xl text-sm transition disabled:opacity-50"
            >
              <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
            Failed to load live market data. Showing demo data. {error instanceof Error ? error.message : ''}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="text-6xl font-semibold tracking-tighter">Market Intelligence</h1>
                <p className="text-2xl text-zinc-400 mt-1">Real-time edge discovery on Polymarket</p>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="card rounded-3xl p-6 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl"><DollarSign className="text-emerald-400" /></div>
                <div>
                  <div className="text-xs text-zinc-500">TOTAL VOLUME (FILTERED)</div>
                  <div className="text-4xl font-semibold tabular-nums tracking-tight">{kpiStats.totalVolume}</div>
                </div>
              </div>
              <div className="card rounded-3xl p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl"><BarChart3 className="text-blue-400" /></div>
                <div>
                  <div className="text-xs text-zinc-500">ACTIVE MARKETS</div>
                  <div className="text-4xl font-semibold tabular-nums tracking-tight">{kpiStats.activeMarkets}</div>
                </div>
              </div>
              <div className="card rounded-3xl p-6 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-2xl"><TrendingUp className="text-amber-400" /></div>
                <div>
                  <div className="text-xs text-zinc-500">HIGH LIQUIDITY</div>
                  <div className="text-4xl font-semibold tabular-nums tracking-tight">{kpiStats.highLiquidity}</div>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target size={20} /> Top Opportunities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayEvents.slice(0, 6).map(event => {
                const prob = getPrimaryProbability(event.markets[0]);
                const isWatched = watchlist.includes(event.id);
                return (
                  <div 
                    key={event.id} 
                    onClick={() => openDetail(event)}
                    className="market-card card rounded-3xl p-6 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-xs px-3 py-1 bg-zinc-800 rounded-full text-zinc-400">{event.category}</div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleWatchlist(event.id); }}
                        className="text-zinc-500 hover:text-yellow-400 transition"
                      >
                        {isWatched ? <Star className="fill-yellow-400 text-yellow-400" size={18} /> : <Star size={18} />}
                      </button>
                    </div>
                    <h3 className="font-semibold text-[15px] leading-tight line-clamp-3 mb-4 pr-2 group-hover:text-blue-400 transition">
                      {event.title}
                    </h3>
                    
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-6xl font-semibold tabular-nums tracking-[-2px]">{prob.toFixed(1)}</span>
                      <span className="text-3xl text-zinc-400">¢</span>
                    </div>

                    <ProbabilitySparkline currentProb={prob} marketId={event.id} />

                    <div className="flex justify-between text-xs mt-4 text-zinc-500">
                      <div>{formatVolume(event.volume)} vol</div>
                      <div>{formatLiquidity(event.liquidity)} liq</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCANNER TAB */}
        {activeTab === 'scanner' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-4xl font-semibold tracking-tight">Market Scanner</h2>
              <div className="text-sm text-zinc-500">{displayEvents.length} markets {isUsingDemo ? '(Demo)' : '• Live'}</div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex-1 min-w-[260px] relative">
                <Search className="absolute left-4 top-3.5 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search markets or categories..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input w-full pl-11 py-3 rounded-2xl text-sm"
                />
              </div>
              
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="input px-4 py-3 rounded-2xl text-sm min-w-[140px]"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value as any)}
                className="input px-4 py-3 rounded-2xl text-sm"
              >
                <option value="volume">Sort: Highest Volume</option>
                <option value="liquidity">Sort: Highest Liquidity</option>
                <option value="endDate">Sort: Ending Soonest</option>
              </select>
            </div>

            <div className="flex gap-6 mb-6 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-zinc-500">Min Volume</span>
                <input type="range" min="5000" max="500000" step="5000" value={minVolume} onChange={e => setMinVolume(Number(e.target.value))} className="accent-blue-500 w-40" />
                <span className="font-mono text-xs w-16">{formatVolume(minVolume)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-zinc-500">Min Liquidity</span>
                <input type="range" min="1000" max="1000000" step="1000" value={minLiquidity} onChange={e => setMinLiquidity(Number(e.target.value))} className="accent-blue-500 w-40" />
                <span className="font-mono text-xs w-16">{formatLiquidity(minLiquidity)}</span>
              </div>
            </div>

            <div className="card rounded-3xl overflow-hidden">
              <div className="divide-y divide-zinc-800">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <div key={i} className="px-6 py-5 skeleton h-16" />)
                ) : displayEvents.length === 0 ? (
                  <div className="px-6 py-12 text-center text-zinc-500">No markets match your filters.</div>
                ) : (
                  displayEvents.map(event => {
                    const prob = getPrimaryProbability(event.markets[0]);
                    const isWatched = watchlist.includes(event.id);
                    return (
                      <div key={event.id} onClick={() => openDetail(event)} className="table-row px-6 py-4 flex items-center justify-between cursor-pointer group">
                        <div className="pr-6 flex-1">
                          <div className="font-medium text-[15px] group-hover:text-blue-400 transition line-clamp-1">{event.title}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{event.category} • Ends {format(new Date(event.endDate), 'MMM d, yyyy')}</div>
                        </div>
                        <div className="flex items-center gap-8 text-sm tabular-nums">
                          <div className="text-right">
                            <div className="font-mono text-emerald-400 text-lg font-semibold">{prob.toFixed(1)}<span className="text-xs text-zinc-500">¢</span></div>
                          </div>
                          <div className="text-right w-20">
                            <div className="font-medium">{formatVolume(event.volume)}</div>
                            <div className="text-[10px] text-zinc-500">volume</div>
                          </div>
                          <div className="text-right w-20">
                            <div className="font-medium">{formatLiquidity(event.liquidity)}</div>
                            <div className="text-[10px] text-zinc-500">liquidity</div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(event.id); }} className="p-2 text-zinc-400 hover:text-yellow-400 transition">
                            {isWatched ? <StarOff size={18} className="text-yellow-400" /> : <Star size={18} />}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* EDGE TOOLS TAB */}
        {activeTab === 'tools' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-4xl font-semibold tracking-tight mb-2">Kelly Position Sizer</h2>
              <p className="text-zinc-400">Calculate optimal bet size based on your edge vs market probability.</p>
            </div>

            <div className="card rounded-3xl p-8 space-y-8">
              <div>
                <label className="text-xs tracking-widest text-zinc-500">YOUR BANKROLL (USD)</label>
                <input type="number" value={bankroll} onChange={e => setBankroll(Math.max(1000, Number(e.target.value)))} className="input w-full text-5xl font-semibold py-6 mt-2 rounded-2xl tracking-tighter" />
              </div>

              <div>
                <div className="flex justify-between text-xs tracking-widest text-zinc-500 mb-2">
                  <span>YOUR ESTIMATED TRUE PROBABILITY</span>
                  <span className="font-mono text-emerald-400">{modelProb}%</span>
                </div>
                <input type="range" min="25" max="95" step="1" value={modelProb} onChange={e => setModelProb(Number(e.target.value))} className="accent-blue-500 w-full" />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <div>Low conviction</div>
                  <div>High conviction</div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 text-sm text-zinc-400">
                Enter a market in the Scanner or Overview to see personalized Kelly sizing in the detail view.
              </div>
            </div>
          </div>
        )}

        {/* WATCHLIST TAB */}
        {activeTab === 'watchlist' && (
          <div>
            <h2 className="text-4xl font-semibold tracking-tight mb-8">Your Watchlist</h2>
            {watchlist.length === 0 ? (
              <div className="card rounded-3xl p-12 text-center">
                <Star className="mx-auto mb-4 text-zinc-700" size={48} />
                <p className="text-xl text-zinc-400">No markets saved yet.</p>
                <p className="mt-2 text-sm">Star interesting markets from Overview or Scanner.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayEvents.filter(e => watchlist.includes(e.id)).map(event => {
                  const prob = getPrimaryProbability(event.markets[0]);
                  return (
                    <div key={event.id} onClick={() => openDetail(event)} className="market-card card rounded-3xl p-6 cursor-pointer">
                      <div className="flex justify-between">
                        <div className="text-xs px-3 py-1 bg-zinc-800 rounded-full inline-block mb-3">{event.category}</div>
                        <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(event.id); }} className="text-yellow-400">
                          <StarOff size={18} />
                        </button>
                      </div>
                      <h3 className="font-semibold mb-4 pr-4">{event.title}</h3>
                      <div className="text-5xl font-semibold tabular-nums tracking-tight mb-1">{prob.toFixed(1)}<span className="text-2xl text-zinc-400">¢</span></div>
                      <div className="text-xs text-zinc-500">{formatVolume(event.volume)} volume</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedEvent && selectedMarket && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4" onClick={closeDetail}>
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.985 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-3xl w-full overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1 flex items-center gap-2">
                      {selectedEvent.category} • {format(new Date(selectedEvent.endDate), 'MMMM d, yyyy')}
                    </div>
                    <h2 className="text-3xl font-semibold tracking-tight pr-8">{selectedEvent.title}</h2>
                  </div>
                  <button onClick={closeDetail} className="text-zinc-400 hover:text-white text-3xl leading-none mt-1">×</button>
                </div>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-[92px] font-semibold tabular-nums tracking-[-4.5px] leading-none">{marketProb.toFixed(1)}</span>
                  <span className="text-4xl text-zinc-400 -mb-4">¢</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                  <div className="lg:col-span-3">
                    <div className="text-xs text-zinc-500 mb-2">PROBABILITY TRAJECTORY (SIMULATED)</div>
                    <ProbabilitySparkline currentProb={marketProb} marketId={selectedEvent.id} />
                  </div>
                  
                  <div className="lg:col-span-2 space-y-4 text-sm">
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">Volume</span>
                      <span className="font-mono">{formatVolume(selectedEvent.volume)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">Liquidity</span>
                      <span className="font-mono">{formatLiquidity(selectedEvent.liquidity)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">Resolution Source</span>
                      <span className="text-right text-xs leading-tight">{selectedEvent.resolutionSource || 'Official source'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold">Kelly Position Sizer</div>
                      <div className="text-xs text-zinc-500">Based on your model probability vs market</div>
                    </div>
                    <div className="text-emerald-400 font-mono text-sm">EDGE: {kellyResult ? kellyResult.edge.toFixed(1) : '0'}%</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-zinc-500">MARKET PROB</div>
                      <div className="text-3xl font-semibold tabular-nums">{marketProb.toFixed(1)}<span className="text-base text-zinc-400">¢</span></div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">YOUR MODEL</div>
                      <div className="text-3xl font-semibold tabular-nums text-emerald-400">{modelProb}<span className="text-base text-zinc-400">%</span></div>
                    </div>
                  </div>

                  {kellyResult && kellyResult.recommendedSize > 0 && (
                    <div className="mt-6 pt-6 border-t border-zinc-800">
                      <div className="text-xs text-zinc-500 mb-1">RECOMMENDED POSITION (½ KELLY)</div>
                      <div className="text-6xl font-semibold tabular-nums tracking-tighter text-emerald-400">
                        ${kellyResult.recommendedSize.toFixed(0)}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        Kelly fraction: {(kellyResult.kellyFraction * 100).toFixed(1)}% of bankroll
                      </div>
                    </div>
                  )}

                  {kellyResult && kellyResult.edge <= 0 && (
                    <div className="mt-6 text-sm text-amber-400">No positive edge at current model probability.</div>
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-800 px-8 py-5 bg-zinc-900/50 flex gap-3">
                <button onClick={() => toggleWatchlist(selectedEvent.id)} className="flex-1 py-3 rounded-2xl border border-zinc-700 hover:bg-zinc-800 transition flex items-center justify-center gap-2 text-sm">
                  {watchlist.includes(selectedEvent.id) ? <><StarOff size={16} /> Remove from Watchlist</> : <><Star size={16} /> Add to Watchlist</>}
                </button>
                <button onClick={closeDetail} className="flex-1 py-3 bg-white text-black rounded-2xl font-medium text-sm hover:bg-zinc-200 transition">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
