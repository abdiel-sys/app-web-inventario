import { useState } from 'react';
import { Droplets, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const QUICK_LOGINS = [
  { label: 'Admin', role: 'admin', badge: 'badge-admin', email: 'admin@aquastock.com', password: 'admin123' },
  { label: 'Driver', role: 'driver', badge: 'badge-driver', email: 'driver@aquastock.com', password: 'driver123' },
  { label: 'Warehouse', role: 'warehouse', badge: 'badge-warehouse', email: 'warehouse@aquastock.com', password: 'wh123' },
];

export default function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (ql) => {
    setError('');
    setEmail(ql.email);
    setPassword(ql.password);
    setLoading(true);
    try {
      await login(ql.email, ql.password);
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page" aria-label="Sign in page">
      <div className="login-bg-orb login-bg-orb-1" aria-hidden="true" />
      <div className="login-bg-orb login-bg-orb-2" aria-hidden="true" />

      <div className="login-card">
        <div className="login-logo" aria-hidden="true">
          <Droplets size={28} color="#fff" />
        </div>

        <h1 className="login-title">AquaStock</h1>
        <p className="login-subtitle">Sign in to your inventory dashboard</p>

        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <form id="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="you@company.com"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                id="toggle-password"
                type="button"
                className="password-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-pressed={showPw}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ height: '44px', justifyContent: 'center', fontSize: '0.925rem' }}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Sign in'}
          </button>
        </form>

        {/*   <div className="login-divider">Demo quick-login</div> */}
        {/**/}
        {/*   <div className="quick-login-grid"> */}
        {/*     {QUICK_LOGINS.map((ql) => ( */}
        {/*       <button */}
        {/*         key={ql.role} */}
        {/*         id={`quick-login-${ql.role}`} */}
        {/*         className="quick-login-btn" */}
        {/*         onClick={() => handleQuickLogin(ql)} */}
        {/*         disabled={loading} */}
        {/*         title={`Sign in as ${ql.label}`} */}
        {/*       > */}
        {/*         <ShieldCheck size={16} /> */}
        {/*         <span className={`badge ${ql.badge}`}>{ql.label}</span> */}
        {/*       </button> */}
        {/*     ))} */}
        {/*   </div> */}
      </div>
    </main>
  );
}
