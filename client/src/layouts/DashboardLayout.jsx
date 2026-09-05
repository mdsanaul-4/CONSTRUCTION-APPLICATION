import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import api from '../services/api.js';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/suppliers': 'Labour Suppliers',
  '/labourers': 'Labourers',
  '/attendance': 'Attendance',
  '/payroll': 'Payroll',
  '/payments': 'Payments',
  '/reports': 'Reports',
  '/activity': 'Activity Log',
  '/settings': 'Settings',
};

function titleFor(pathname) {
  const match = Object.keys(TITLES).find((k) => pathname.startsWith(k));
  return match ? TITLES[match] : 'Construction Labour Manager';
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const location = useLocation();

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setCompanyName(res.data.data.settings.companyName))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex">
      <Sidebar companyName={companyName} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} title={titleFor(location.pathname)} />
        <main className="flex-1 p-4 lg:p-6 max-w-350 w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
