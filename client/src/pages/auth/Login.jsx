import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { HardHat, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { apiErrorMessage } from '../../services/api.js';
import { AnimatePresence, motion, MotionConfig, resize } from "motion/react";
import { useCallback, useId, useState } from 'react';

function ConditionalField({ open, label, error, ...props }) {
  const [height, setHeight] = useState(0);
  const internalId = useId();
  const id = props.id ?? internalId;

  const measureRef = useCallback((node) => {
    if (!node) return;

    const observer = new ResizeObserver(() => {
      setHeight(node.scrollHeight);
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      animate={{ height: open ? height : 0 }}
      className="overflow-hidden"
    >
      <div ref={measureRef}>
        <AnimatePresence mode="popLayout">
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 0 }}
            >
              <label htmlFor={id} className="label">
                {label}
              </label>

              <input
                {...props}
                id={id}
                className="input"
              />

              {error && (
                <p className="text-sm text-red-500 mt-1">
                  {error}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}



export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    const to = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={to} replace />;
  }

async function handleSubmit(e) {
  e.preventDefault();

  if (!showPassword) {
    setShowPassword(true);
    return;
  }

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
    <motion.div  initial={{ opacity: 0, y: -8 }}
  animate={{ opacity: 1, y: 0 }} className="  motion-design flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-400">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center">
            <HardHat size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-offwhite text-xl">Construction Labour Manager</span>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div >
            <h1 className="font-display font-semibold text-lg text-ink-900">Sign in</h1>
            <p className="text-sm text-ink-600 mt-0.5">Enter your credentials to access your dashboard.</p>
          </div>

          <div>
            <label className="  text-ink-900 label" htmlFor="email">Email</label>
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
          <ConditionalField
  label="Password"
  name="password"
  id="password"
  open={showPassword}
  type="password"
  placeholder="••••••••"
  autoComplete="current-password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required
/>

          <button type="submit" className="btn text-white bg-gradient-to-b from-blue-500 to-blue-600 w-full py-2.5" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign in'}
          </button>
         
        </form>

        <p className="text-center text-xs text-100/50 mt-6">
          No account yet? Ask your administrator to create the first owner account with the seed script.
        </p>
      </div>
    </motion.div>
  );
}
