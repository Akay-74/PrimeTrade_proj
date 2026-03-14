import React, { useMemo, useState } from 'react';
import StatCard from '../components/StatCard.jsx';
import { formatCurrency } from '../utils/formatters.js';
import { Star, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const COINS = [
  { rank:1, name:"Bitcoin", symbol:"BTC", price:109756.89, change24h:3.42, change7d:8.21, marketCap:"$2.1T", volume:"$45.2B", color:"#F7931A" },
  { rank:2, name:"Ethereum", symbol:"ETH", price:2536.20, change24h:2.17, change7d:5.43, marketCap:"$304.5B", volume:"$18.7B", color:"#627EEA" },
  { rank:3, name:"Solana", symbol:"SOL", price:129.79, change24h:0.17, change7d:-2.14, marketCap:"$59.8B", volume:"$3.2B", color:"#9945FF" },
  { rank:4, name:"BNB", symbol:"BNB", price:612.35, change24h:-1.28, change7d:3.67, marketCap:"$89.1B", volume:"$1.8B", color:"#F3BA2F" },
  { rank:5, name:"Avalanche", symbol:"AVAX", price:38.42, change24h:5.63, change7d:12.4, marketCap:"$15.7B", volume:"$892M", color:"#E84142" },
  { rank:6, name:"Cardano", symbol:"ADA", price:0.891, change24h:-0.54, change7d:1.23, marketCap:"$31.2B", volume:"$654M", color:"#0033AD" },
  { rank:7, name:"Polkadot", symbol:"DOT", price:9.87, change24h:1.92, change7d:-3.41, marketCap:"$13.4B", volume:"$421M", color:"#E6007A" },
  { rank:8, name:"Chainlink", symbol:"LINK", price:18.43, change24h:4.21, change7d:9.87, marketCap:"$10.8B", volume:"$312M", color:"#2A5ADA" },
  { rank:9, name:"Polygon", symbol:"MATIC", price:1.23, change24h:-2.14, change7d:0.54, marketCap:"$12.1B", volume:"$589M", color:"#8247E5" },
  { rank:10, name:"Uniswap", symbol:"UNI", price:12.67, change24h:3.87, change7d:6.32, marketCap:"$9.6B", volume:"$278M", color:"#FF007A" },
];

// Generate sparkline data per coin (seeded by rank for consistency)
const generateSparkline = (rank, positive) => {
  const seed = rank * 137;
  return Array.from({ length: 10 }, (_, i) => ({
    v: 50 + Math.sin((seed + i) * 0.8) * 20 + (positive ? i * 2 : -i * 1.5) + ((seed * (i + 1)) % 15),
  }));
};

const ChangeBadge = ({ value }) => {
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 mono text-xs font-semibold ${positive ? 'text-[#00FF9D]' : 'text-[#FF3B6B]'}`}>
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {positive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
};

const MarketPage = () => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [watchlist, setWatchlist] = useState([]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = useMemo(() => {
    let list = [...COINS];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const va = a[sortKey]; const vb = b[sortKey];
      if (typeof va === 'number') return sortAsc ? va - vb : vb - va;
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return list;
  }, [query, sortKey, sortAsc]);

  const toggleWatchlist = (symbol) => {
    setWatchlist(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]);
  };

  const SortHeader = ({ label, field, className = '' }) => (
    <th className={`py-2 px-2 cursor-pointer select-none hover:text-[var(--accent-cyan)] transition-colors ${className}`}
        onClick={() => toggleSort(field)}>
      {label} {sortKey === field ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Market</h1>
          <p className="text-sm text-text-secondary">Live cryptocurrency prices</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-elevated)] border border-border">
          {['USD', 'BTC'].map(c => (
            <button key={c} onClick={() => setCurrency(c)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                currency === c ? 'bg-[var(--accent-cyan)] text-[#0a0f1e]' : 'text-text-secondary hover:text-white'
              }`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Market Cap" value="$2.1T" subtitle="+2.4% today" colorClass="text-[#00ff9d]" glow="border-t-2 border-t-[#00D4FF]" />
        <StatCard title="24h Volume" value="$89.4B" colorClass="text-white" glow="border-t-2 border-t-[#00D4FF]" />
        <StatCard title="BTC Dominance" value="52.3%" colorClass="text-white" glow="border-t-2 border-t-[#00D4FF]" />
        <StatCard title="Active Coins" value="12,847" colorClass="text-white" glow="border-t-2 border-t-[#00D4FF]" />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[var(--bg-elevated)] border border-border max-w-sm">
        <Search size={16} className="text-text-secondary" />
        <input
          type="text"
          placeholder="Search coins..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent border-none text-sm text-white placeholder:text-text-secondary/70 outline-none w-full"
        />
      </div>

      {/* Market Table */}
      <div className="glass-card overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs min-w-[900px]">
          <thead className="text-text-secondary text-[11px] label-xs">
            <tr className="text-left bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.08)]">
              <SortHeader label="#" field="rank" />
              <SortHeader label="Coin" field="name" />
              <SortHeader label="Price" field="price" className="text-right" />
              <SortHeader label="24h" field="change24h" className="text-right" />
              <SortHeader label="7d" field="change7d" className="text-right" />
              <th className="py-2 px-2">Market Cap</th>
              <th className="py-2 px-2">Volume</th>
              <th className="py-2 px-2 w-16">Chart</th>
              <th className="py-2 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((coin) => {
              const spark = generateSparkline(coin.rank, coin.change24h >= 0);
              const strokeColor = coin.change24h >= 0 ? '#00FF9D' : '#FF3B6B';
              const inWatchlist = watchlist.includes(coin.symbol);
              return (
                <tr key={coin.symbol}
                    className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="py-3 px-2 text-text-secondary">{coin.rank}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] mono font-semibold shrink-0"
                           style={{ backgroundColor: coin.color }}>{coin.symbol[0]}</div>
                      <div>
                        <div className="text-sm font-semibold text-white">{coin.symbol}</div>
                        <div className="text-[11px] text-text-secondary">{coin.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right mono text-white font-semibold">{formatCurrency(coin.price)}</td>
                  <td className="py-3 px-2 text-right"><ChangeBadge value={coin.change24h} /></td>
                  <td className="py-3 px-2 text-right"><ChangeBadge value={coin.change7d} /></td>
                  <td className="py-3 px-2 text-white">{coin.marketCap}</td>
                  <td className="py-3 px-2 text-text-secondary">{coin.volume}</td>
                  <td className="py-3 px-2">
                    <div className="w-[60px] h-[32px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={spark}>
                          <Line type="monotone" dataKey="v" stroke={strokeColor} strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button onClick={() => toggleWatchlist(coin.symbol)}
                      className={`p-1.5 rounded-md border transition-colors ${
                        inWatchlist
                          ? 'border-[var(--accent-cyan)] bg-[rgba(0,212,255,0.12)] text-[var(--accent-cyan)]'
                          : 'border-border text-text-secondary hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]'
                      }`}>
                      <Star size={14} fill={inWatchlist ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketPage;
