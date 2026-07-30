import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../services/api.js';
import { setSession } from '../services/auth.js';
import { IconCutlery, IconEye, IconEyeOff, IconLock, IconUser, IconHeadset } from '../components/icons.jsx';
import logo from '../assets/logo.png';

const FEATURES = [
  'Fast table-side billing and KOT printing',
  'Live kitchen display with auto-refresh',
  'Works offline with a browser-print fallback',
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      const { token, role } = res.data;
      setSession(token, role, remember);

      const from = location.state?.from?.pathname;
      const roleHome = role === 'admin' ? '/admin' : '/';
      const sameRealm = from && (role === 'admin' ? from.startsWith('/admin') : !from.startsWith('/admin'));
      navigate(sameRealm ? from : roleHome, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-paper">
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-navy text-white p-12 relative overflow-hidden">
        <IconCutlery className="absolute -right-10 -bottom-10 w-72 h-72 text-white/5" />

        <div className="relative flex justify-center">
          <div className="bg-white rounded-md px-3 py-2">
            <img src={logo} alt="Lavanya Plaza" className="h-8 w-auto" />
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="font-display text-3xl font-semibold leading-snug">
            Billing &amp; KOT,
            <br />
            made simple.
          </h1>
          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-white/80">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rust shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-white/50 space-y-1">
          <div>&copy; {new Date().getFullYear()} CounterPOS. Single-restaurant billing made easy.</div>
          <div>Design &amp; Developed by : Layoncube</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-6 animate-fade-in">
            <img src={logo} alt="Lavanya Plaza" className="h-9 w-auto mx-auto" />
          </div>

          <div className="bg-white rounded-xl shadow-xl border border-line/60 p-8 animate-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center mb-5">
              <IconHeadset className="w-5 h-5 text-navy" />
            </div>

            <h2 className="font-display text-2xl font-semibold text-ink mb-1">Welcome back</h2>
            <p className="text-sm text-ink-soft mb-6">Sign in to open the counter.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1.5">Username</label>
                <div className="flex items-center gap-2 border border-line rounded-md px-3 py-2.5 bg-white transition-all focus-within:border-navy focus-within:ring-4 focus-within:ring-navy/10">
                  <IconUser className="w-4 h-4 text-ink-soft shrink-0" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. counter1"
                    autoComplete="username"
                    className="outline-none bg-transparent text-sm w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-soft mb-1.5">Password</label>
                <div className="flex items-center gap-2 border border-line rounded-md px-3 py-2.5 bg-white transition-all focus-within:border-navy focus-within:ring-4 focus-within:ring-navy/10">
                  <IconLock className="w-4 h-4 text-ink-soft shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="outline-none bg-transparent text-sm w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-ink-soft hover:text-ink shrink-0 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-rust animate-fade-in">{error}</p>}

              <div className="flex items-center text-xs">
                <label className="flex items-center gap-1.5 text-ink-soft">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Keep me signed in
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rust hover:bg-rust/90 text-white font-medium text-sm py-2.5 rounded-md shadow-md shadow-rust/20 transition-all hover:shadow-lg hover:shadow-rust/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="text-xs text-ink-soft/70 mt-6 text-center">
              In case of forgot password, contact your admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
