import React, { useEffect, useMemo, useState } from 'react';
import { getTradesApi, createTradeApi, updateTradeApi, deleteTradeApi } from '../api/trades.api.js';
import StatCard from '../components/StatCard.jsx';
import TradeCard from '../components/TradeCard.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters.js';
import {
  LayoutDashboard,
  BarChart2,
  ArrowLeftRight,
  PieChart,
  Calendar,
  MoreHorizontal,
  Zap,
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const statusBadgeClasses = (status) => {
  switch (status) {
    case 'OPEN':
      return 'border-[var(--accent-cyan)] text-[var(--accent-cyan)]';
    case 'CLOSED':
      return 'border-slate-500 text-slate-300';
    case 'CANCELLED':
      return 'border-[var(--accent-red)] text-[var(--accent-red)]';
    default:
      return 'border-slate-500 text-slate-300';
  }
};

const typeBadgeClasses = (type) =>
  type === 'BUY'
    ? 'bg-[var(--accent-green)] text-black'
    : 'bg-[var(--accent-red)] text-white';

const PAGE_SIZE = 5;

const coinColors = {
  BTC: '#f7931a',
  ETH: '#3b82f6',
  SOL: '#a855f7',
  BNB: '#facc15',
  AVAX: '#f97373'
};

const coinNames = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  BNB: 'BNB',
  AVAX: 'Avalanche'
};

const DashboardPage = () => {
  const { success, error } = useToast();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [showPremium, setShowPremium] = useState(true);
  const [watchlistPrices, setWatchlistPrices] = useState({});
  const [flashByCoin, setFlashByCoin] = useState({});
  const [displayBalance, setDisplayBalance] = useState(0);

  const [form, setForm] = useState({
    coin: '',
    type: 'BUY',
    amount: '',
    price: '',
    notes: ''
  });

  const stats = useMemo(() => {
    const totalPortfolio = trades
      .filter((t) => t.status === 'OPEN')
      .reduce((sum, t) => sum + t.totalValue, 0);
    const totalTrades = trades.length;
    const buys = trades.filter((t) => t.type === 'BUY').length;
    const sells = trades.filter((t) => t.type === 'SELL').length;
    return { totalPortfolio, totalTrades, buys, sells };
  }, [trades]);

  const holdings = useMemo(() => {
    const map = new Map();
    trades.forEach((t) => {
      const key = t.coin;
      const existing = map.get(key) || {
        coin: t.coin,
        totalTrades: 0,
        invested: 0,
        buys: 0,
        sells: 0
      };
      existing.totalTrades += 1;
      existing.invested += t.totalValue;
      if (t.type === 'BUY') existing.buys += 1;
      if (t.type === 'SELL') existing.sells += 1;
      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [trades]);

  const watchlist = useMemo(
    () =>
      holdings.map((h) => ({
        ...h,
        price: watchlistPrices[h.coin] ?? h.invested
      })),
    [holdings, watchlistPrices]
  );

  const watchlistChangePct = {
    BTC: 3.42,
    ETH: 2.17,
    SOL: 0.17,
    BNB: -1.28,
    AVAX: 5.63
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const { data } = await getTradesApi({ limit: 50 });
      setTrades(data?.data?.trades || []);
    } catch (err) {
      error('Failed to load trades.');
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const target = stats.totalPortfolio || 0;
    let frameId;
    const start = performance.now();
    const duration = 900;

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayBalance(target * progress);
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [stats.totalPortfolio]);

  useEffect(() => {
    if (!holdings.length) return;

    const interval = setInterval(() => {
      const rates = {
        BTC: 0.0003,
        ETH: 0.0005,
        SOL: 0.0008,
        BNB: 0.0004,
        AVAX: 0.01
      };

      const bias = {
        BNB: -0.00015
      };

      setWatchlistPrices((prev) => {
        const nextMap = { ...prev };
        holdings.forEach((h) => {
          const rate = rates[h.coin] ?? 0.0005;
          const current = prev[h.coin] ?? h.invested;
          const base = (Math.random() * 2 - 1) * rate;
          const biased = base + (bias[h.coin] ?? 0);
          const next = current * (1 + biased);
          nextMap[h.coin] = next;

          const direction = next >= current ? 'up' : 'down';
          setFlashByCoin((f) => ({ ...f, [h.coin]: direction }));
          setTimeout(() => {
            setFlashByCoin((f) => {
              const copy = { ...f };
              delete copy[h.coin];
              return copy;
            });
          }, 300);
        });
        return nextMap;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [holdings]);

  const liveUpdates = [
    {
      symbol: 'BTC',
      pair: 'BTC/USD',
      name: 'Bitcoin',
      price: 109687.6,
      changePct: 3.42,
      spark: Array.from({ length: 18 }, (_, i) => ({
        t: i,
        v: 105000 + Math.sin(i * 0.35) * 1200 + Math.random() * 400 + i * 80
      }))
    },
    {
      symbol: 'ETH',
      pair: 'ETH/USD',
      name: 'Ethereum',
      price: 14380.8,
      changePct: 2.17,
      spark: Array.from({ length: 18 }, (_, i) => ({
        t: i,
        v: 13200 + Math.sin(i * 0.32) * 180 + Math.random() * 90 + i * 22
      }))
    },
    {
      symbol: 'BNB',
      pair: 'BNB/USD',
      name: 'BNB',
      price: 4268.8,
      changePct: -1.28,
      spark: Array.from({ length: 18 }, (_, i) => ({
        t: i,
        v: 4520 + Math.sin(i * 0.38) * 60 + Math.random() * 35 - i * 8
      }))
    }
  ];

  const chartData = Array.from({ length: 30 }, (_, i) => ({
    time: i,
    price:
      90000 +
      Math.sin(i * 0.3) * 2000 +
      Math.random() * 1000 +
      i * 100
  }));

  const yearlyData = [
    { month: 'Jan', value: 42 },
    { month: 'Feb', value: 55 },
    { month: 'Mar', value: 48 },
    { month: 'Apr', value: 70 },
    { month: 'May', value: 65 },
    { month: 'Jun', value: 90 },
    { month: 'Jul', value: 85 },
    { month: 'Aug', value: 110 },
    { month: 'Sep', value: 130 },
    { month: 'Oct', value: 180 },
    { month: 'Nov', value: 240 },
    { month: 'Dec', value: 289 }
  ];

  const filteredTrades = trades.filter((t) => {
    if (filter === 'BUY' && t.type !== 'BUY') return false;
    if (filter === 'SELL' && t.type !== 'SELL') return false;
    if (filter === 'OPEN' && t.status !== 'OPEN') return false;
    if (filter === 'CLOSED' && t.status !== 'CLOSED') return false;
    if (query && !t.coin.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filteredTrades.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageTrades = filteredTrades.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const openModalForNew = () => {
    setEditing(null);
    setForm({ coin: '', type: 'BUY', amount: '', price: '', notes: '' });
    setModalOpen(true);
  };

  const openModalForEdit = (trade) => {
    setEditing(trade);
    setForm({
      coin: trade.coin,
      type: trade.type,
      amount: String(trade.amount),
      price: String(trade.price),
      notes: trade.notes || ''
    });
    setModalOpen(true);
  };

  const handleSaveTrade = async (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount || '0');
    const price = parseFloat(form.price || '0');
    if (!form.coin || !amount || !price) return;

    try {
      if (editing) {
        const { data } = await updateTradeApi(editing.id, {
          ...form,
          amount,
          price
        });
        const updated = data?.data?.trade;
        if (updated) setTrades((prev) =>
          prev.map((t) => (t.id === editing.id ? updated : t))
        );
        success('Trade updated.');
      } else {
        const { data } = await createTradeApi({
          ...form,
          amount,
          price
        });
        const created = data?.data?.trade;
        if (created) setTrades((prev) => [created, ...prev]);
        success('Trade added.');
      }
      setModalOpen(false);
    } catch (err) {
      error('Failed to save trade.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteTradeApi(confirmDelete.id);
      setTrades((prev) => prev.filter((t) => t.id !== confirmDelete.id));
      setConfirmDelete(null);
      success('Trade deleted.');
    } catch (err) {
      error('Failed to delete trade.');
    }
  };

  const liveTotal =
    (parseFloat(form.amount || '0') || 0) * (parseFloat(form.price || '0') || 0);

  return (
    <div className="w-full px-4 lg:px-6 py-6 flex flex-col xl:flex-row gap-4">
      {/* Center main column */}
      <div className="flex-1 space-y-4">
        {/* Balance + actions header */}
        <section className="glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={14} className="text-text-secondary" />
              <div className="label-xs text-text-secondary">My Balance</div>
            </div>
            <div className="mono text-[40px] sm:text-[52px] font-semibold text-[#00ff9d] leading-tight">
              {formatCurrency(displayBalance || 0)}
            </div>
            <div className="mt-2 flex flex-wrap items-start text-[11px] text-text-secondary">
              <div className="pr-6 mr-6 border-r border-[rgba(255,255,255,0.08)]">
                <div className="label-xs text-text-secondary mb-0.5">
                  Total Profit
                </div>
                <div className="mono text-[var(--accent-green)] text-xs">
                  {formatCurrency(stats.totalPortfolio * 0.12)}
                </div>
              </div>
              <div className="pr-6 mr-6 border-r border-[rgba(255,255,255,0.08)]">
                <div className="label-xs text-text-secondary mb-0.5">
                  Avg. Growing
                </div>
                <div className="mono text-[var(--accent-cyan)] text-xs">
                  +15.80%
                </div>
              </div>
              <div>
                <div className="label-xs text-text-secondary mb-0.5">
                  Best Performer
                </div>
                <div className="mono text-xs text-white font-semibold">
                  {holdings[0]?.coin ? holdings[0].coin : 'BTC'}
                </div>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-[52%]">
            <div className="flex items-center gap-2 text-[11px] text-text-secondary mb-2 justify-start sm:justify-end">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
              <span>Live Crypto Updates · Last update 5 minutes ago</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {liveUpdates.map((u) => {
                const positive = u.changePct >= 0;
                const stroke = positive ? '#00FF9D' : '#FF3B6B';
                const fill = positive ? 'rgba(0,255,157,0.12)' : 'rgba(255,59,107,0.12)';
                return (
                  <div
                    key={u.pair}
                    className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center mono text-[11px] font-semibold shrink-0"
                          style={{ backgroundColor: coinColors[u.symbol] || '#1e293b' }}
                        >
                          {u.symbol[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] text-text-secondary">{u.pair}</div>
                          <div className="text-xs font-semibold text-white truncate">
                            {u.name}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => success(`${u.name} details coming soon!`)}
                        className="text-text-secondary hover:text-text-primary leading-none"
                        aria-label="More"
                      >
                        ⋮
                      </button>
                    </div>

                    <div className="mt-2 text-[10px] text-text-secondary">Price</div>
                    <div className="mono text-sm font-semibold text-white">
                      {formatCurrency(u.price)}
                    </div>

                    <div className="mt-2 h-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={u.spark}>
                          <XAxis hide />
                          <YAxis hide domain={['auto', 'auto']} />
                          <Area
                            type="monotone"
                            dataKey="v"
                            stroke={stroke}
                            strokeWidth={2}
                            fill={fill}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          positive
                            ? 'bg-[rgba(0,255,157,0.15)] text-[#00FF9D]'
                            : 'bg-[rgba(255,59,107,0.15)] text-[#FF3B6B]'
                        }`}
                      >
                        {u.changePct > 0 ? `+${u.changePct.toFixed(2)}%` : `${u.changePct.toFixed(2)}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 mt-3 justify-start sm:justify-end">
              <button 
                onClick={() => success('Top Up feature coming soon!')} 
                className="btn-primary text-xs px-5 rounded-lg inline-flex items-center gap-2"
              >
                <Plus size={14} />
                <span>Top Up</span>
              </button>
              <button 
                onClick={() => success('Withdraw feature coming soon!')} 
                className="btn-ghost text-xs px-5 rounded-lg inline-flex items-center gap-2 bg-transparent border border-[var(--accent-cyan)] text-[var(--accent-cyan)]"
              >
                Withdraw
              </button>
            </div>
          </div>
        </section>

        {/* Stats + mock chart row */}
        <section className="grid lg:grid-cols-[2fr,3fr] gap-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="Portfolio Value"
                value={formatCurrency(stats.totalPortfolio)}
                subtitle="Sum of open trades"
                colorClass="text-[#00ff9d]"
                glow="border-t-2 border-t-[#00ff9d]"
              />
              <StatCard
                title="Total Trades"
                value={formatNumber(stats.totalTrades)}
                colorClass="text-white"
                glow="border-t-2 border-t-[#00D4FF]"
              />
              <StatCard
                title="Buy Orders"
                value={formatNumber(stats.buys)}
                colorClass="text-[#00ff9d]"
                glow="border-t-2 border-t-[#00ff9d]"
                icon={<TrendingUp size={16} />}
              />
              <StatCard
                title="Sell Orders"
                value={formatNumber(stats.sells)}
                colorClass="text-[#ff3b6b]"
                glow="border-t-2 border-t-[#ff3b6b]"
                icon={<TrendingDown size={16} />}
              />
            </div>

            <div className="glass-card overflow-x-auto scrollbar-thin">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">Holdings by Coin</h2>
              </div>
              <table className="w-full text-xs min-w-[520px]">
                <thead className="text-text-secondary text-[11px] label-xs">
                  <tr className="text-left bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.08)]">
                    <th className="py-2 px-2">Coin</th>
                    <th className="px-2">Total Trades</th>
                    <th className="px-2">Total Invested</th>
                    <th className="px-2 text-right">BUY</th>
                    <th className="px-2 text-right">SELL</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr
                      key={h.coin}
                      className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(0,212,255,0.03)] transition-colors duration-150 cursor-pointer"
                    >
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] mono"
                            style={{ backgroundColor: coinColors[h.coin] || '#1e293b' }}
                          >
                            {h.coin[0]}
                          </div>
                          <span className="mono text-sm font-semibold text-white">
                            {h.coin}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 text-white mono">{h.totalTrades}</td>
                      <td className="px-2 mono text-[var(--accent-cyan)]">
                        {formatCurrency(h.invested)}
                      </td>
                      <td className="px-2 text-right mono text-[var(--accent-green)] font-semibold">
                        {h.buys}
                      </td>
                      <td className="px-2 text-right mono text-[var(--accent-red)] font-semibold">
                        {h.sells}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center mono text-xs font-semibold"
                    style={{ backgroundColor: coinColors.BTC }}
                  >
                    B
                  </div>
                  <div>
                    <div className="mono text-sm font-semibold text-white">BTC / USD</div>
                    <div className="text-[11px] text-text-secondary">Bitstamp</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 text-[11px] text-text-secondary">
                {['1H', '1D', '1W'].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 py-0.5 rounded-full border text-[10px] transition-colors duration-150 ${
                      timeframe === tf
                        ? 'bg-[var(--accent-cyan)] text-[#0a0f1e] border-transparent'
                        : 'border-[rgba(255,255,255,0.14)] text-text-secondary'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 rounded-lg bg-[rgba(10,15,30,0.85)] relative overflow-hidden">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      background: '#0D1627',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff'
                    }}
                    formatter={(v) => [`$${v.toLocaleString()}`, 'Price']}
                    labelFormatter={() => ''}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#00D4FF"
                    strokeWidth={2}
                    fill="url(#priceGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="mono text-lg text-white font-semibold">$109,687.60</div>
              <span className="px-2 py-0.5 rounded-full bg-[rgba(0,255,157,0.15)] text-[11px] text-[var(--accent-green)] font-semibold">
                +3.42%
              </span>
            </div>
          </div>
        </section>

        {/* Trades section */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">My Trades</h2>
            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'BUY', 'SELL', 'OPEN', 'CLOSED'].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    filter === f
                      ? 'border-[var(--accent-cyan)] bg-[rgba(0,212,255,0.12)] text-[var(--accent-cyan)]'
                      : 'border-border text-text-secondary'
                  }`}
                >
                  {f}
                </button>
              ))}
              <input
                type="text"
                placeholder="Search coin..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-md bg-[var(--bg-elevated)] border border-border text-xs focus:outline-none focus:border-[var(--accent-cyan)]"
              />
              <button onClick={openModalForNew} className="btn-primary text-xs">
                New Trade
              </button>
            </div>
          </div>

          <div className="hidden md:block glass-card overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs min-w-[760px]">
              <thead className="text-text-secondary text-[11px]">
                <tr className="text-left">
                  <th className="py-2">Coin</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Price</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageTrades.map((t) => (
                  <tr
                    key={t.id}
                    className="border-t border-border/60 hover:border-l-2 hover:border-l-[var(--accent-cyan)]"
                  >
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[11px] mono">
                          {t.coin[0]}
                        </div>
                        <span className="mono font-semibold">{t.coin}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeBadgeClasses(
                          t.type
                        )}`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="mono">{formatNumber(t.amount)}</td>
                    <td className="mono">{formatCurrency(t.price)}</td>
                    <td
                      className={`mono ${
                        t.type === 'BUY'
                          ? 'text-[var(--accent-green)]'
                          : 'text-[var(--accent-red)]'
                      }`}
                    >
                      {formatCurrency(t.totalValue)}
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusBadgeClasses(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td>{formatDate(t.createdAt)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModalForEdit(t)}
                          className="px-2 py-1 rounded-md bg-[rgba(0,212,255,0.12)] text-[var(--accent-cyan)]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete(t)}
                          className="px-2 py-1 rounded-md bg-[rgba(255,59,107,0.15)] text-[var(--accent-red)]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {pageTrades.map((t) => (
              <TradeCard
                key={t.id}
                trade={t}
                onEdit={openModalForEdit}
                onDelete={setConfirmDelete}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>
              Page {currentPage} of {pageCount}
            </span>
            <div className="flex gap-2">
              <button
                className="btn-ghost px-3 py-1 text-xs"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                className="btn-ghost px-3 py-1 text-xs"
                disabled={currentPage === pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Right sidebar */}
      <aside className="hidden xl:flex w-72 flex-col gap-4">
        <div className="glass-card border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-xs font-medium text-white">My Portfolio</div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(0,255,157,0.15)] text-[var(--accent-green)]">
                  +5.76%
                </span>
              </div>
              <div className="mono text-xl text-white">
                {formatCurrency(stats.totalPortfolio || 0)}
              </div>
            </div>
          </div>
          <div className="text-xs">
            {holdings.map((h, idx) => (
              <div
                key={h.coin}
                className={`flex items-center justify-between px-3 py-2.5 bg-[rgba(10,16,30,0.9)] hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-150 ${
                  idx !== holdings.length - 1
                    ? 'border-b border-[rgba(255,255,255,0.04)]'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] mono"
                    style={{ backgroundColor: coinColors[h.coin] || '#1e293b' }}
                  >
                    {h.coin[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{h.coin}</div>
                    <div className="text-[11px] text-text-secondary">
                      {coinNames[h.coin] || h.coin}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="mono text-[11px] text-white">
                    {formatCurrency(h.invested)}
                  </div>
                  <div className="text-[11px] text-[#00FF9D] mono">
                    +3.42%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <div className="label-xs text-text-secondary mb-1">Yearly Performance</div>
          <div className="mono text-xl mb-1 text-[var(--accent-cyan)]">$289.49</div>
          <div className="text-[11px] text-text-secondary mb-2">
            High · Dec 6, 2024
          </div>
          <div className="rounded-lg bg-[rgba(10,15,30,0.85)] overflow-hidden">
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart
                data={yearlyData}
                margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="yearGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF9D" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00FF9D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis hide />
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Tooltip
                  contentStyle={{
                    background: '#0D1627',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                  formatter={(v) => [`$${v}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00FF9D"
                  strokeWidth={2}
                  fill="url(#yearGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-text-secondary">
              <span>High · Dec 6, 2024</span>
              <span className="mono text-[#00FF9D]">$289.49</span>
            </div>
            <div className="flex items-center justify-between text-text-secondary">
              <span>Low · Jan 2, 2024</span>
              <span className="mono">$42.10</span>
            </div>
          </div>
        </div>
      </aside>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Trade' : 'New Trade'}
        wide
      >
        <form onSubmit={handleSaveTrade} className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Coin</label>
              <input
                type="text"
                value={form.coin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, coin: e.target.value.toUpperCase() }))
                }
                className="w-full px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-border text-sm focus:outline-none focus:border-[var(--accent-cyan)]"
                placeholder="BTC"
              />
              <div className="flex gap-2 mt-2">
                {['BTC', 'ETH', 'SOL', 'BNB'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, coin: c }))}
                    className="px-2 py-1 rounded-md text-[11px] bg-[var(--bg-elevated)] border border-border hover:border-[var(--accent-cyan)]"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Type</label>
              <div className="flex gap-2">
                {['BUY', 'SELL'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`flex-1 px-3 py-2 rounded-md text-sm border ${
                      form.type === t
                        ? t === 'BUY'
                          ? 'border-[var(--accent-green)] bg-[rgba(0,255,157,0.1)] text-[var(--accent-green)]'
                          : 'border-[var(--accent-red)] bg-[rgba(255,59,107,0.12)] text-[var(--accent-red)]'
                        : 'border-border text-text-secondary'
                    }`}
                  >
                    {t === 'BUY' ? 'BUY 🟢' : 'SELL 🔴'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-border text-sm focus:outline-none focus:border-[var(--accent-cyan)]"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  Price per coin ($)
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-border text-sm focus:outline-none focus:border-[var(--accent-cyan)]"
                  placeholder="0.0"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Notes (optional)
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-border text-sm focus:outline-none focus:border-[var(--accent-cyan)] resize-none"
                placeholder="Strategy, rationale, etc."
              />
            </div>
          </div>
          <div className="flex flex-col justify-between gap-4">
            <div className="glass-card p-4">
              <div className="text-xs text-text-secondary mb-1">Live Preview</div>
              <div className="text-[11px] text-text-secondary mb-2">
                {form.amount || '0'} {form.coin || 'COIN'} @ $
                {form.price || '0.00'}
              </div>
              <div className="mono text-xl text-[var(--accent-cyan)]">
                Total Value: {formatCurrency(liveTotal)}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-ghost flex-1 sm:flex-none"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1 sm:flex-none">
                {editing ? 'Save Changes' : 'Add Trade'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Trade"
      >
        <p className="text-sm text-text-secondary mb-4">
          Are you sure you want to delete this {confirmDelete?.coin} trade?
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setConfirmDelete(null)}
          >
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;

