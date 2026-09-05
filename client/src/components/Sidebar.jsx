import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  HardHat,
  Users,
  UserCircle,
  ClipboardCheck,
  Wallet,
  Banknote,
  FileBarChart2,
  History,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { to: '/projects', label: 'Projects', icon: HardHat, permission: 'projects.view' },
  { to: '/suppliers', label: 'Labour Suppliers', icon: Users, permission: 'suppliers.view' },
  { to: '/labourers', label: 'Labourers', icon: UserCircle, permission: 'labourers.view' },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck, permission: 'attendance.view' },
  { to: '/payroll', label: 'Payroll', icon: Wallet, permission: 'payroll.view' },
  { to: '/payments', label: 'Payments', icon: Banknote, permission: 'payments.view' },
  { to: '/reports', label: 'Reports', icon: FileBarChart2, permission: 'reports.view' },
  { to: '/activity', label: 'Activity Log', icon: History, permission: 'activity.view' },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar({ companyName, open, onClose }) {
  const { user, hasPermission } = useAuth();
  return (
    <>
      {open && <div className="fixed inset-0 bg-ink-900/50 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-steel-900 text-steel-100 flex flex-col z-40 transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div>
            <p className="font-display font-bold text-white text-lg leading-tight">{companyName || 'Construction Labour Manager'}</p>
            <p className="text-xs text-steel-100/60 mt-0.5">Site & payroll controls</p>
          </div>
          <button className="lg:hidden text-steel-100/70" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {NAV_ITEMS.filter(({ permission }) => !permission || hasPermission(permission)).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium mb-1 transition-colors ${
                  isActive ? 'bg-safety-500 text-white' : 'text-steel-100/80 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-xs text-steel-100/50">
          Construction Labour Manager
        </div>
      </aside>
    </>
  );
}
