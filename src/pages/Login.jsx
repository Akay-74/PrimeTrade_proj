import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

const LoginPage = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { error('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login(email, password);
      success('Welcome back!');
    } catch (err) {
      error(err.response?.data?.detail || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-10 items-center">
        {/* Left panel */}
        <div className="hidden lg:block">
          <h1 className="text-4xl font-semibold mb-4 text-white">
            Welcome to <span className="text-[var(--accent-cyan)]">PrimeTrade</span>
          </h1>
          <p className="text-text-secondary mb-6">
            Track your crypto portfolio with real-time analytics, trade management, and market insights.
          </p>

          {/* Floating stat cards */}
          <div className="space-y-3">
            {[
              { label: 'Portfolio Value', value: '$64,125.00', color: 'var(--accent-green)' },
              { label: 'Today\'s P&L', value: '+$2,847.00', color: 'var(--accent-green)' },
              { label: 'Active Trades', value: '6', color: 'var(--accent-cyan)' },
            ].map(card => (
              <div key={card.label} className="glass-card flex items-center justify-between max-w-sm">
                <span className="text-sm text-text-secondary">{card.label}</span>
                <span className="mono font-semibold" style={{ color: card.color }}>{card.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Login form */}
        <div className="glass-card p-8 w-full max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-2 text-white">Sign In</h2>
          <p className="text-text-secondary text-sm mb-6">Access your PrimeTrade dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-border text-sm focus:outline-none focus:border-[var(--accent-cyan)]"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-border text-sm focus:outline-none focus:border-[var(--accent-cyan)]"
                placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 p-3 rounded-lg bg-[var(--bg-elevated)] border border-border">
            <p className="text-[11px] text-text-secondary mb-1 font-semibold">Demo Credentials:</p>
            <p className="text-[11px] text-text-secondary">Admin: admin@primetrade.ai / Admin@123</p>
            <p className="text-[11px] text-text-secondary">User: trader@primetrade.ai / Trader@123</p>
          </div>

          <p className="text-xs text-text-secondary mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-[var(--accent-cyan)] hover:underline font-medium">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
