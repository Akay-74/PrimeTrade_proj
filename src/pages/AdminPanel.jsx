import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import StatCard from '../components/StatCard.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { getUsersApi, updateUserRoleApi, deleteUserApi } from '../api/users.api.js';
import { getTradesApi, deleteTradeApi } from '../api/trades.api.js';
import { Search } from 'lucide-react';

const PAGE_SIZE = 5;

const AdminPanelPage = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userQuery, setUserQuery] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [tradePage, setTradePage] = useState(1);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const [confirmDeleteTrade, setConfirmDeleteTrade] = useState(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [uRes, tRes] = await Promise.all([
        getUsersApi({ limit: 100 }),
        getTradesApi({ limit: 100 }),
      ]);
      setUsers(uRes.data?.data?.users || []);
      setTrades(tRes.data?.data?.trades || []);
    } catch { error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  // Stats
  const stats = useMemo(() => {
    const volume = trades.reduce((s, t) => s + (t.totalValue || 0), 0);
    const coins = {};
    trades.forEach(t => { coins[t.coin] = (coins[t.coin] || 0) + 1; });
    const topCoin = Object.keys(coins).sort((a, b) => coins[b] - coins[a])[0] || '-';
    return { totalUsers: users.length, totalTrades: trades.length, volume, topCoin };
  }, [users, trades]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!userQuery) return users;
    const q = userQuery.toLowerCase();
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, userQuery]);

  const userPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const visUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);
  const tradePages = Math.max(1, Math.ceil(trades.length / PAGE_SIZE));
  const visTrades = trades.slice((tradePage - 1) * PAGE_SIZE, tradePage * PAGE_SIZE);

  const handleRoleChange = async (id, role) => {
    try {
      await updateUserRoleApi(id, role);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      success('Role updated');
    } catch { error('Failed to update role'); }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    try {
      await deleteUserApi(confirmDeleteUser.id);
      setUsers(prev => prev.filter(u => u.id !== confirmDeleteUser.id));
      success('User deleted');
    } catch { error('Failed to delete user'); }
    finally { setConfirmDeleteUser(null); }
  };

  const handleDeleteTrade = async () => {
    if (!confirmDeleteTrade) return;
    try {
      await deleteTradeApi(confirmDeleteTrade.id);
      setTrades(prev => prev.filter(t => t.id !== confirmDeleteTrade.id));
      success('Trade deleted');
    } catch { error('Failed to delete trade'); }
    finally { setConfirmDeleteTrade(null); }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <div className="glass-card p-8 text-center">
          <h1 className="text-2xl font-semibold mb-2 text-white">Access Denied</h1>
          <p className="text-text-secondary mb-6">You need admin privileges to view this page.</p>
          <a href="/dashboard" className="btn-primary w-full">Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
          <p className="text-sm text-text-secondary">Platform management</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-semibold border border-[var(--accent-cyan)] text-[var(--accent-cyan)]">ADMIN</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} colorClass="text-white" />
        <StatCard title="Total Trades" value={stats.totalTrades} colorClass="text-white" />
        <StatCard title="Platform Volume" value={formatCurrency(stats.volume)} colorClass="text-[var(--accent-cyan)]" />
        <StatCard title="Most Traded" value={stats.topCoin} colorClass="text-[var(--accent-cyan)]" />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[rgba(255,255,255,0.08)]">
        {['users', 'trades'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t ? 'border-[var(--accent-cyan)] text-white' : 'border-transparent text-text-secondary hover:text-white'
            }`}>{t === 'users' ? 'Users' : 'All Trades'}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-12 rounded-lg bg-[rgba(255,255,255,0.04)] animate-pulse" />)}</div>
      ) : tab === 'users' ? (
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-border max-w-xs">
              <Search size={14} className="text-text-secondary" />
              <input type="text" placeholder="Search by name or email..." value={userQuery}
                onChange={e => { setUserQuery(e.target.value); setUserPage(1); }}
                className="bg-transparent border-none text-xs text-white placeholder:text-text-secondary/70 outline-none w-full" />
            </div>
          </div>
          <div className="glass-card overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs min-w-[820px]">
              <thead className="text-text-secondary text-[11px]">
                <tr className="text-left border-b border-[rgba(255,255,255,0.08)]">
                  <th className="py-2">User</th><th>Email</th><th>Role</th><th>Trades</th><th>Portfolio Value</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visUsers.map(u => (
                  <tr key={u.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[11px] font-semibold border border-border">
                          {u.name.split(' ').map(p => p[0]).join('')}
                        </div>
                        <span className="text-sm text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-text-secondary">{u.email}</td>
                    <td>
                      <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="bg-[var(--bg-elevated)] border border-border rounded-md px-2 py-1 text-xs text-white outline-none focus:border-[var(--accent-cyan)]">
                        <option>USER</option><option>ADMIN</option>
                      </select>
                    </td>
                    <td className="mono">{u.tradeCount}</td>
                    <td className="mono text-[var(--accent-green)]">{formatCurrency(u.portfolioValue)}</td>
                    <td className="text-text-secondary">{formatDate(u.createdAt)}</td>
                    <td>
                      <button onClick={() => setConfirmDeleteUser(u)}
                        className="px-2 py-1 rounded-md bg-[rgba(255,59,107,0.15)] text-[var(--accent-red)] text-[10px]">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Page {userPage} of {userPages}</span>
            <div className="flex gap-2">
              <button className="btn-ghost px-3 py-1 text-xs" disabled={userPage<=1} onClick={()=>setUserPage(p=>p-1)}>Prev</button>
              <button className="btn-ghost px-3 py-1 text-xs" disabled={userPage>=userPages} onClick={()=>setUserPage(p=>p+1)}>Next</button>
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="glass-card overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs min-w-[820px]">
              <thead className="text-text-secondary text-[11px]">
                <tr className="text-left border-b border-[rgba(255,255,255,0.08)]">
                  <th className="py-2">Coin</th><th>Type</th><th>Amount</th><th>Price</th><th>Total</th><th>Status</th><th>Date</th><th>Trader</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visTrades.map(t => (
                  <tr key={t.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="py-2.5 mono font-semibold text-white">{t.coin}</td>
                    <td><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.type==='BUY'?'bg-[var(--accent-green)] text-black':'bg-[var(--accent-red)] text-white'}`}>{t.type}</span></td>
                    <td className="mono">{t.amount}</td>
                    <td className="mono">{formatCurrency(t.price)}</td>
                    <td className="mono">{formatCurrency(t.totalValue)}</td>
                    <td className="text-text-secondary">{t.status}</td>
                    <td className="text-text-secondary">{formatDate(t.createdAt)}</td>
                    <td className="text-text-secondary">{t.userName || 'N/A'}</td>
                    <td>
                      <button onClick={() => setConfirmDeleteTrade(t)}
                        className="px-2 py-1 rounded-md bg-[rgba(255,59,107,0.15)] text-[var(--accent-red)] text-[10px]">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Page {tradePage} of {tradePages}</span>
            <div className="flex gap-2">
              <button className="btn-ghost px-3 py-1 text-xs" disabled={tradePage<=1} onClick={()=>setTradePage(p=>p-1)}>Prev</button>
              <button className="btn-ghost px-3 py-1 text-xs" disabled={tradePage>=tradePages} onClick={()=>setTradePage(p=>p+1)}>Next</button>
            </div>
          </div>
        </section>
      )}

      <ConfirmDialog open={!!confirmDeleteUser} title="Delete User"
        message={`Delete ${confirmDeleteUser?.name}? This will delete all their trades too.`}
        onClose={() => setConfirmDeleteUser(null)} onConfirm={handleDeleteUser} />
      <ConfirmDialog open={!!confirmDeleteTrade} title="Delete Trade"
        message={`Delete this ${confirmDeleteTrade?.coin} trade?`}
        onClose={() => setConfirmDeleteTrade(null)} onConfirm={handleDeleteTrade} />
    </div>
  );
};

export default AdminPanelPage;
