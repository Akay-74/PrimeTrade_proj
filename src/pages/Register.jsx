import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

const passwordStrength = (pwd) => {
  if (!pwd) return { color: 'bg-slate-700', label: 'Weak', width: 'w-0' };
  const hasNumber = /\d/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  if (pwd.length < 6) return { color: 'bg-[var(--accent-red)]', label: 'Weak', width: 'w-1/4' };
  if (pwd.length < 8 || !(hasNumber || hasUpper))
    return { color: 'bg-yellow-400', label: 'Medium', width: 'w-1/2' };
  if (pwd.length >= 8 && hasNumber && hasUpper)
    return { color: 'bg-[var(--accent-green)]', label: 'Strong', width: 'w-full' };
  return { color: 'bg-yellow-400', label: 'Medium', width: 'w-1/2' };
};

const RegisterPage = () => {
  const { register } = useAuth();
  const { success, error } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) { error('Please fill in all fields.'); return; }
    if (password !== confirmPassword) { error('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      success('Account created!');
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-10 items-center">
        <div className="hidden lg:block">
          <h1 className="text-4xl font-semibold mb-4 text-white">Join PrimeTrade.</h1>
          <p className="text-text-secondary mb-6">Start tracking your crypto trades today.</p>
          <ul className="space-y-3 text-sm text-text-secondary">
            <li>✓ Track BUY &amp; SELL trades</li>
            <li>✓ Real-time portfolio analytics</li>
            <li>✓ Secure JWT authentication</li>
            <li>✓ Role-based access control</li>
          </ul>
        </div>

        <div className="glass-card p-8 w-full max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-2 text-white">Create Account</h2>
          <p className="text-text-secondary text-sm mb-6">Set up your PrimeTrade profile to get started.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-border text-sm focus:outline-none focus:border-[var(--accent-cyan)]"
                placeholder="Alex Trader" />
            </div>
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
              <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${strength.color} ${strength.width} transition-all`} />
              </div>
              <div className="text-[11px] text-text-secondary mt-1">Strength: {strength.label}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-border text-sm focus:outline-none focus:border-[var(--accent-cyan)]"
                placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-xs text-text-secondary mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--accent-cyan)] hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
