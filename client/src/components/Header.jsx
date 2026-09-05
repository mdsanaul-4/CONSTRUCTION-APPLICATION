import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header({ onMenuClick, title }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-concrete-200">
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        <div className="flex items-center gap-3 min-w-0">
          <button className="lg:hidden text-ink-600" onClick={onMenuClick} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <h1 className="font-display font-semibold text-ink-900 truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-ink-600">
            <User size={16} />
            <span>{user?.name}</span>
            <span className="badge bg-concrete-100 text-ink-600 capitalize">{user?.role}</span>
          </div>
          <button onClick={logout} className="btn btn-secondary px-2 py-1.5" aria-label="Log out" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
