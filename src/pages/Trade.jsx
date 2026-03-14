import React, { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters.js';
import { useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { getTradesApi, createTradeApi, updateTradeApi, deleteTradeApi } from '../api/trades.api.js';

const COINS = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', marketPrice: 109756.89 },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', marketPrice: 2536.20 },
  { symbol: 'SOL', name: 'Solana', color: '#9945FF', marketPrice: 129.79 },
  { symbol: 'BNB', name: 'BNB', color: '#F3BA2F', marketPrice: 612.35 },
  { symbol: 'AVAX', name: 'Avalanche', color: '#E84142', marketPrice: 38.42 },
];

const TIMEFRAMES = ['15M', '1H', '4H', '1D', '1W'];
const PAGE_SIZE = 5;

const generateChartData = (coin, tf) => {
  const points = tf === '15M' ? 20 : tf === '1H' ? 24 : tf === '4H' ? 30 : tf === '1D' ? 30 : 52;
  const base = COINS.find(c => c.symbol === coin)?.marketPrice || 100;
  const seed = coin.charCodeAt(0) + tf.charCodeAt(0);
  return Array.from({ length: points }, (_, i) => ({
    time: i,
    label: tf === '1W' ? `W${i + 1}` : tf === '1D' ? `D${i + 1}` : `${i}`,
    price: base * (0.95 + Math.sin((seed + i) * 0.4) * 0.03 + (i / points) * 0.06 + ((seed * i) % 7) * 0.003),
  }));
};

const TradePage = () => {
  const { success, error } = useToast();
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [timeframe, setTimeframe] = useState('1D');
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Order form
  const [orderType, setOrderType] = useState('BUY');
  const [formCoin, setFormCoin] = useState('BTC');
  const [formAmount, setFormAmount] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit modal + delete confirm
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ coin: '', type: 'BUY', amount: '', price: '', notes: '', status: 'OPEN' });
  const [deleteId, setDeleteId] = useState(null);

  const coinInfo = COINS.find(c => c.symbol === selectedCoin) || COINS[0];
  const chartData = useMemo(() => generateChartData(selectedCoin, timeframe), [selectedCoin, timeframe]);
  const currentPrice = chartData[chartData.length - 1]?.price || 0;

  useEffect(() => { fetchTrades(); }, []);

  const fetchTrades = async () => {
    try {
      const { data } = await getTradesApi({ limit: 100 });
      setTrades(data?.data?.trades || []);
    } catch { error('Failed to load trades'); }
    finally { setLoading(false); }
  };

  const pageTrades = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return trades.slice(start, start + PAGE_SIZE);
  }, [trades, page]);
  const pageCount = Math.max(1, Math.ceil(trades.length / PAGE_SIZE));

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    const price = parseFloat(formPrice);
    if (!formCoin || !amount || !price) return;
    setSubmitting(true);
    try {
      const { data } = await createTradeApi({ coin: formCoin, type: orderType, amount, price, notes: formNotes });
      const created = data?.data?.trade;
      if (created) setTrades(prev => [created, ...prev]);
      success(`${orderType} order placed`);
      setFormAmount(''); setFormPrice(''); setFormNotes('');
    } catch { error('Failed to place order'); }
    finally { setSubmitting(false); }
  };

  const openEdit = (t) => {
    setEditForm({ coin: t.coin, type: t.type, amount: String(t.amount), price: String(t.price), notes: t.notes || '', status: t.status });
    setEditModal(t);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    const amount = parseFloat(editForm.amount);
    const price = parseFloat(editForm.price);
    if (!editForm.coin || !amount || !price) return;
    try {
      const { data } = await updateTradeApi(editModal.id, { ...editForm, amount, price });
      const updated = data?.data?.trade;
      if (updated) setTrades(prev => prev.map(t => t.id === editModal.id ? updated : t));
      success('Trade updated'); setEditModal(null);
    } catch { error('Failed to update'); }
  };

  const handleDelete = async () => {
    try {
      await deleteTradeApi(deleteId);
      setTrades(prev => prev.filter(t => t.id !== deleteId));
      success('Trade deleted');
    } catch { error('Failed to delete'); }
    finally { setDeleteId(null); }
  };

  const liveTotal = (parseFloat(formAmount) || 0) * (parseFloat(formPrice) || 0);
  const fee = liveTotal * 0.001;
  const availableBalance = 8329.77;

  const handleQuickAmount = (pct) => {
    const mp = COINS.find(c => c.symbol === formCoin)?.marketPrice || 100;
    const val = (availableBalance * pct) / mp;
    setFormAmount(val.toFixed(6));
  };

  const useMarketPrice = () => {
    const mp = COINS.find(c => c.symbol === formCoin)?.marketPrice || 0;
    setFormPrice(mp.toFixed(2));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-4">
        {/* LEFT — Chart + Recent Trades */}
        <div className="space-y-4">
          {/* Chart */}
          <div className="glass-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <select value={selectedCoin} onChange={e => setSelectedCoin(e.target.value)}
                  className="bg-[var(--bg-elevated)] border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent-cyan)]">
                  {COINS.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</option>)}
                </select>
                <div className="flex gap-1">
                  {TIMEFRAMES.map(tf => (
                    <button key={tf} onClick={() => setTimeframe(tf)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                        timeframe === tf ? 'bg-[var(--accent-cyan)] text-[#0a0f1e] border-transparent' : 'border-[rgba(255,255,255,0.14)] text-text-secondary'
                      }`}>{tf}</button>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="mono text-xl text-white font-semibold">{formatCurrency(currentPrice)}</div>
                <span className="px-2 py-0.5 rounded-full bg-[rgba(0,255,157,0.15)] text-[11px] text-[#00FF9D] font-semibold">+3.42%</span>
              </div>
            </div>
            <div className="rounded-lg bg-[rgba(10,15,30,0.85)] overflow-hidden">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tradeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8899AA' }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto','auto']} tick={{ fontSize: 10, fill: '#8899AA' }} axisLine={false} tickLine={false} orientation="right"
                    tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background:'#0D1627', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', fontSize:'12px', color:'#fff' }}
                    formatter={v => [`${formatCurrency(v)}`, 'Price']} />
                  <Area type="monotone" dataKey="price" stroke="#00D4FF" strokeWidth={2} fill="url(#tradeGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Recent Trades</h2>
              <span className="text-[11px] text-text-secondary">{trades.length} total</span>
            </div>
            {loading ? (
              <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-10 rounded bg-[rgba(255,255,255,0.04)] animate-pulse"/>)}</div>
            ) : (
              <>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-xs min-w-[620px]">
                    <thead className="text-text-secondary text-[11px]">
                      <tr className="text-left border-b border-[rgba(255,255,255,0.08)]">
                        <th className="py-2">Coin</th><th>Type</th><th>Amount</th><th>Price</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageTrades.map(t => (
                        <tr key={t.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                          <td className="py-2 mono font-semibold text-white">{t.coin}</td>
                          <td><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.type==='BUY'?'bg-[var(--accent-green)] text-black':'bg-[var(--accent-red)] text-white'}`}>{t.type}</span></td>
                          <td className="mono">{formatNumber(t.amount)}</td>
                          <td className="mono">{formatCurrency(t.price)}</td>
                          <td className={`mono ${t.type==='BUY'?'text-[var(--accent-green)]':'text-[var(--accent-red)]'}`}>{formatCurrency(t.totalValue)}</td>
                          <td><span className="text-text-secondary">{t.status}</span></td>
                          <td className="text-text-secondary">{formatDate(t.createdAt)}</td>
                          <td>
                            <div className="flex gap-1">
                              <button onClick={() => openEdit(t)} className="px-2 py-1 rounded bg-[rgba(0,212,255,0.12)] text-[var(--accent-cyan)] text-[10px]">Edit</button>
                              <button onClick={() => setDeleteId(t.id)} className="px-2 py-1 rounded bg-[rgba(255,59,107,0.15)] text-[var(--accent-red)] text-[10px]">Del</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-text-secondary">
                  <span>Page {Math.min(page,pageCount)} of {pageCount}</span>
                  <div className="flex gap-2">
                    <button className="btn-ghost px-3 py-1 text-xs" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
                    <button className="btn-ghost px-3 py-1 text-xs" disabled={page>=pageCount} onClick={()=>setPage(p=>p+1)}>Next</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT — Order Form */}
        <div className="space-y-4">
          <div className="glass-card p-0 overflow-hidden">
            {/* BUY/SELL toggle */}
            <div className="flex">
              {['BUY','SELL'].map(t => (
                <button key={t} onClick={() => setOrderType(t)}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                    orderType===t
                      ? t==='BUY' ? 'bg-[#00FF9D] text-black' : 'bg-[#FF3B6B] text-white'
                      : 'bg-[var(--bg-elevated)] text-text-secondary hover:text-white'
                  }`}>{t}</button>
              ))}
            </div>

            <form onSubmit={handleSubmitOrder} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Coin</label>
                <select value={formCoin} onChange={e => setFormCoin(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--accent-cyan)]">
                  {COINS.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">Amount</label>
                <div className="relative">
                  <input type="number" step="any" value={formAmount} onChange={e=>setFormAmount(e.target.value)}
                    className="w-full px-3 py-2.5 pr-14 rounded-lg bg-[var(--bg-elevated)] border border-border text-sm mono focus:outline-none focus:border-[var(--accent-cyan)]"
                    placeholder="0.00" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary mono">{formCoin}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[0.25,0.50,0.75,1].map(pct => (
                    <button key={pct} type="button" onClick={() => handleQuickAmount(pct)}
                      className="px-2 py-1 rounded text-[10px] border border-[var(--accent-cyan)] text-[var(--accent-cyan)] hover:bg-[rgba(0,212,255,0.1)]">
                      {pct===1?'MAX':`${pct*100}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">Price per Coin (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">$</span>
                  <input type="number" step="any" value={formPrice} onChange={e=>setFormPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-border text-sm mono focus:outline-none focus:border-[var(--accent-cyan)]"
                    placeholder="0.00" />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-text-secondary">Market: {formatCurrency(COINS.find(c=>c.symbol===formCoin)?.marketPrice||0)}</span>
                  <button type="button" onClick={useMarketPrice} className="text-[11px] text-[var(--accent-cyan)] hover:underline">Use Market Price</button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">Notes (optional)</label>
                <textarea rows={3} value={formNotes} onChange={e=>setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-border text-sm focus:outline-none focus:border-[var(--accent-cyan)] resize-none"
                  placeholder="Strategy, rationale, etc." />
              </div>

              {/* Order Summary */}
              <div className="rounded-lg bg-[var(--bg-elevated)] p-4 space-y-2 text-xs">
                <div className="text-text-secondary font-semibold mb-2">Order Summary</div>
                <div className="flex justify-between"><span className="text-text-secondary">Amount</span><span className="mono text-white">{formAmount || '0'} {formCoin}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Price</span><span className="mono text-white">{formatCurrency(parseFloat(formPrice)||0)}</span></div>
                <div className="border-t border-[rgba(255,255,255,0.06)] my-2" />
                <div className="flex justify-between"><span className="text-text-secondary">Total Value</span><span className="mono text-[var(--accent-cyan)] text-sm font-semibold">{formatCurrency(liveTotal)}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Fee (0.1%)</span><span className="mono text-text-secondary">{formatCurrency(fee)}</span></div>
                <div className="flex justify-between"><span className="text-white font-semibold">Net Total</span><span className="mono text-white font-semibold">{formatCurrency(liveTotal + fee)}</span></div>
              </div>

              <button type="submit" disabled={submitting || !formAmount || !formPrice}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  orderType==='BUY' ? 'bg-[#00FF9D] text-black hover:opacity-90' : 'bg-[#FF3B6B] text-white hover:opacity-90'
                }`}>
                {submitting ? 'Placing...' : `Place ${orderType} Order`}
              </button>
            </form>
          </div>

          <div className="glass-card">
            <div className="text-xs text-text-secondary mb-1">Available Balance</div>
            <div className="mono text-xl text-white font-semibold">{formatCurrency(availableBalance)}</div>
            <div className="text-[11px] text-text-secondary mt-1">across all assets</div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Trade" wide>
        <form onSubmit={handleEditSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-text-secondary mb-1">Coin</label>
              <input value={editForm.coin} onChange={e=>setEditForm(f=>({...f,coin:e.target.value.toUpperCase()}))} className="w-full px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-border text-sm focus:outline-none focus:border-[var(--accent-cyan)]" /></div>
            <div><label className="block text-xs text-text-secondary mb-1">Status</label>
              <select value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))} className="w-full px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-border text-sm focus:outline-none focus:border-[var(--accent-cyan)]">
                <option>OPEN</option><option>CLOSED</option><option>CANCELLED</option>
              </select></div>
          </div>
          <div className="flex gap-2">{['BUY','SELL'].map(t=><button key={t} type="button" onClick={()=>setEditForm(f=>({...f,type:t}))}
            className={`flex-1 py-2 rounded-md text-sm border ${editForm.type===t?(t==='BUY'?'border-[var(--accent-green)] bg-[rgba(0,255,157,0.1)] text-[#00FF9D]':'border-[var(--accent-red)] bg-[rgba(255,59,107,0.12)] text-[#FF3B6B]'):'border-border text-text-secondary'}`}>{t}</button>)}</div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-text-secondary mb-1">Amount</label>
              <input type="number" step="any" value={editForm.amount} onChange={e=>setEditForm(f=>({...f,amount:e.target.value}))} className="w-full px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-border text-sm mono focus:outline-none focus:border-[var(--accent-cyan)]" /></div>
            <div><label className="block text-xs text-text-secondary mb-1">Price</label>
              <input type="number" step="any" value={editForm.price} onChange={e=>setEditForm(f=>({...f,price:e.target.value}))} className="w-full px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-border text-sm mono focus:outline-none focus:border-[var(--accent-cyan)]" /></div>
          </div>
          <div><label className="block text-xs text-text-secondary mb-1">Notes</label>
            <textarea rows={2} value={editForm.notes} onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))} className="w-full px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-border text-sm focus:outline-none focus:border-[var(--accent-cyan)] resize-none" /></div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-ghost" onClick={()=>setEditModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete Trade" message="Are you sure you want to delete this trade?"
        onClose={()=>setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default TradePage;
