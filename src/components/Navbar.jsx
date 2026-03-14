import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  const navLinkClasses = ({ isActive }) =>
    `px-3 py-1.5 rounded-md text-sm transition-colors duration-150 ${
      isActive
        ? 'bg-[rgba(0,212,255,0.08)] text-[var(--accent-cyan)]'
        : 'text-text-secondary hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
    }`;

  const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/market', label: 'Market' },
    { to: '/trade', label: 'Trade' },
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/calendar', label: 'Calendar' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-30 border-b border-[rgba(255,255,255,0.06)] backdrop-blur-md bg-[rgba(10,15,30,0.85)]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-baseline gap-1">
            <span className="text-[var(--accent-cyan)] font-extrabold tracking-widest">PRIME</span>
            <span className="text-white font-semibold tracking-widest">TRADE</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses}>{item.label}</NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClasses}>Admin</NavLink>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium text-white">{user?.name || 'User'}</div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isAdmin ? 'bg-[rgba(0,212,255,0.15)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]' : 'border border-slate-500 text-text-secondary'
            }`}>{user?.role || 'USER'}</span>
          </div>
          <button onClick={logout} className="btn-ghost text-xs rounded-full px-4 py-1.5">Logout</button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-border text-text-secondary"
          onClick={() => setMobileOpen(o => !o)}>☰</button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-[rgba(10,15,30,0.98)]">
          <div className="px-4 py-3 space-y-2">
            {NAV_ITEMS.map(item => (
              <NavLink key={item.to} to={item.to} className={navLinkClasses} onClick={() => setMobileOpen(false)}>
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClasses} onClick={() => setMobileOpen(false)}>Admin</NavLink>
            )}
            <div className="pt-2 border-t border-border/60">
              <div className="text-sm text-white mb-2">{user?.name}</div>
              <button onClick={() => { setMobileOpen(false); logout(); }}
                className="btn-ghost text-xs w-full justify-center">Logout</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
