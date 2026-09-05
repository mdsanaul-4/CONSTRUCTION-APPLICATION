import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { HardHat, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { apiErrorMessage } from '../../services/api.js';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    const to = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={to} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-steel-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-10 h-10 rounded-md bg-safety-500 flex items-center justify-center">
            <HardHat size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-white text-xl">Construction Labour Manager</span>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <h1 className="font-display font-semibold text-lg text-ink-900">Sign in</h1>
            <p className="text-sm text-ink-600 mt-0.5">Enter your credentials to access your dashboard.</p>
          </div>

          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full py-2.5" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-steel-100/50 mt-6">
          No account yet? Ask your administrator to create the first owner account with the seed script.
        </p>
      </div>
    </div>
  );
}
