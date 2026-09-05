import {  Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

import Login from './pages/auth/Login.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import ProjectsList from './pages/projects/ProjectsList.jsx';
import ProjectDetail from './pages/projects/ProjectDetail.jsx';
import SuppliersList from './pages/suppliers/SuppliersList.jsx';
import SupplierDetail from './pages/suppliers/SupplierDetail.jsx';
import LabourersList from './pages/labourers/LabourersList.jsx';
import LabourerProfile from './pages/labourers/LabourerProfile.jsx';
import Attendance from './pages/attendance/Attendance.jsx';
import Payroll from './pages/payroll/Payroll.jsx';
import Payments from './pages/payments/Payments.jsx';
import Reports from './pages/reports/Reports.jsx';
import Activity from './pages/activity/Activity.jsx';
import SettingsPage from './pages/settings/Settings.jsx';

export default function App() {
  return (
    
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<ProjectsList />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/suppliers" element={<SuppliersList />} />
                <Route path="/suppliers/:id" element={<SupplierDetail />} />
                <Route path="/labourers" element={<LabourersList />} />
                <Route path="/labourers/:id" element={<LabourerProfile />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    
  );
}
