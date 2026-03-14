import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  BarChart2,
  ArrowLeftRight,
  PieChart,
  Calendar,
  MoreHorizontal,
  Zap,
  LogOut,
  Shield
} from 'lucide-react';
import { formatNumber } from '../utils/formatters.js';
import { useToast } from '../components/Toast.jsx';

// Mock data (since this was formerly in Dashboard.jsx's sidebar)
const coinColors = {
  BTC: '#f7931a',
  ETH: '#3b82f6',
  SOL: '#a855f7',
  BNB: '#facc15',
  AVAX: '#f97373'
};

const watchlist = [
  { coin: 'BTC', price: 109687.6, flash: null, pct: 3.42 },
  { coin: 'ETH', price: 14380.8, flash: null, pct: 2.17 },
  { coin: 'SOL', price: 245.1, flash: 'up', pct: 0.17 },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const [showPremium, setShowPremium] = useState(true);
  const isAdmin = user?.role === 'ADMIN';

  const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/market', label: 'Market', icon: BarChart2 },
    { to: '/trade', label: 'Trade', icon: ArrowLeftRight },
    { to: '/portfolio', label: 'Portfolio', icon: PieChart },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
  ];

  return (
    <aside className="w-[240px] border-r border-[rgba(255,255,255,0.06)] bg-[var(--bg-primary)] flex flex-col h-screen fixed left-0 top-0 overflow-y-auto no-scrollbar z-40">
      {/* Branding */}
      <div className="p-6 pb-2">
        <Link to="/dashboard" className="flex flex-col gap-1 hover:opacity-80 transition-opacity">
          <div className="flex items-baseline gap-1">
            <span className="text-[var(--accent-cyan)] font-extrabold tracking-widest text-[15px]">PRIME</span>
            <span className="text-white font-semibold tracking-widest text-[15px]">TRADE</span>
          </div>
          <div className="text-[11px] text-text-secondary">Portfolio Tracker</div>
        </Link>
      </div>

      {/* Primary Navigation */}
      <div className="px-4 py-4 flex-1">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[rgba(0,212,255,0.08)] border-l-4 border-l-[var(--accent-cyan)] text-[var(--accent-cyan)] pl-2'
                      : 'text-text-secondary hover:bg-[rgba(255,255,255,0.04)] hover:text-white border-l-4 border-transparent pl-2'
                  }`
                }
              >
                <Icon size={16} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          
          {isAdmin && (
            <>
              <div className="my-4 border-t border-[rgba(255,255,255,0.06)] mx-2"></div>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                   `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[rgba(0,212,255,0.08)] border-l-4 border-l-[var(--accent-cyan)] text-[var(--accent-cyan)] pl-2'
                      : 'text-text-secondary hover:bg-[rgba(255,255,255,0.04)] hover:text-white border-l-4 border-transparent pl-2'
                  }`
                }
              >
                <Shield size={16} className="shrink-0" />
                <span>Admin Area</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Watchlist Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-3 mb-3">
            <div className="label-xs text-text-secondary">My Watchlist</div>
            <button
              type="button"
              onClick={() => success('Watchlist configuration coming soon!')}
              className="text-text-secondary hover:text-white transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
          <div className="space-y-1.5 flex flex-col items-center">
            {watchlist.map((h) => {
              const bgColor = coinColors[h.coin] || '#1e293b';
              const pctPositive = h.pct >= 0;
              return (
                <div
                  key={h.coin}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white mono"
                      style={{ backgroundColor: bgColor }}
                    >
                      {h.coin[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white leading-tight">
                        {h.coin}
                      </span>
                      <span className="text-[11px] text-text-secondary font-mono">
                        ${formatNumber(h.price)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-medium font-mono ${
                      pctPositive ? 'text-[#00ff9d]' : 'text-[#ff3b6b]'
                    }`}
                  >
                    {pctPositive ? `+${h.pct.toFixed(2)}%` : `${h.pct.toFixed(2)}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Premium Upgrade */}
        {showPremium && (
          <div className="mt-6 mx-3 glass-card p-4 relative overflow-hidden group border-[rgba(255,255,255,0.08)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-cyan)] opacity-5 rounded-bl-full blur-[20px] group-hover:opacity-10 transition-opacity" />
            <button
              onClick={() => setShowPremium(false)}
              className="absolute top-2 right-2 text-text-secondary hover:text-white text-xs"
            >
              ×
            </button>
            <div className="flex flex-col gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(0,212,255,0.12)] flex items-center justify-center text-[var(--accent-cyan)]">
                <Zap size={16} className="fill-[var(--accent-cyan)]/20" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white mb-1">Premium Features</div>
                <div className="text-[11px] text-text-secondary leading-relaxed mb-3 pr-2">
                  Upgrade to Pro for advanced analytics and export tools.
                </div>
                <button 
                  onClick={() => { success('Premium subscription coming soon!'); setShowPremium(false); }}
                  className="text-[11px] font-semibold text-[var(--accent-cyan)] hover:text-white transition-colors flex items-center gap-1 group-hover:underline"
                >
                  Upgrade now <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User / Footer */}
      <div className="p-4 border-t border-[#1e293b] bg-[rgba(10,15,30,0.5)]">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00d4ff] to-blue-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-[#00d4ff]/20">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white truncate max-w-[100px]">{user?.name || 'User'}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.role || 'Basic'}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
