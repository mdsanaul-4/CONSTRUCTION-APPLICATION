import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

const PERMISSIONS = [
  ['labourers.view', 'View labourers'],
  ['labourers.create', 'Add labourers'],
  ['labourers.update', 'Edit labourers'],
  ['labourers.delete', 'Deactivate labourers'],
  ['attendance.view', 'View attendance'],
  ['attendance.create', 'Mark attendance'],
  ['attendance.update', 'Edit attendance'],
  ['projects.view', 'View projects'],
  ['suppliers.view', 'View suppliers'],
  ['payroll.view', 'View payroll'],
  ['payroll.manage', 'Manage payroll'],
  ['payments.view', 'View payments'],
  ['payments.manage', 'Manage payments'],
  ['reports.view', 'View reports'],
];

const defaultPermissions = {
  manager: ['dashboard.view', 'projects.view', 'suppliers.view', 'labourers.view', 'labourers.create', 'labourers.update', 'labourers.delete', 'attendance.view', 'attendance.create', 'attendance.update', 'payroll.view', 'reports.view'],
  accountant: ['dashboard.view', 'payroll.view', 'payroll.manage', 'payments.view', 'payments.manage', 'reports.view'],
  supervisor: ['dashboard.view', 'labourers.view', 'attendance.view', 'attendance.create'],
};

export default function Settings() {
  const toast = useToast();
  const { user, logout } = useAuth();
  const isOwner = user?.role === 'owner';

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSaving, setUserSaving] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'manager', permissions: [...defaultPermissions.manager] });
  const [editingId, setEditingId] = useState(null);
  const [passwordId, setPasswordId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

  function loadSettings() {
    setLoading(true);
    api.get('/settings')
      .then((res) => setSettings(res.data.data.settings))
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  async function loadUsers() {
    if (!isOwner) return;
    setUsersLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data.items || []);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => { loadSettings(); }, []);
  useEffect(() => { loadUsers(); }, [isOwner]);

  const resetUserForm = () => {
    setEditingId(null);
    setUserForm({ name: '', email: '', password: '', role: 'manager', permissions: [...defaultPermissions.manager] });
  };

  function onRoleChange(role) {
    setUserForm((f) => ({ ...f, role, permissions: [...(defaultPermissions[role] || [])] }));
  }

  function togglePermission(permission) {
    setUserForm((f) => ({
      ...f,
      permissions: f.permissions.includes(permission)
        ? f.permissions.filter((p) => p !== permission)
        : [...f.permissions, permission],
    }));
  }

  function editUser(u) {
    setEditingId(u._id);
    setUserForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      permissions: u.permissions?.length ? [...u.permissions] : [...(defaultPermissions[u.role] || [])],
    });
  }

  async function saveUser(e) {
    e.preventDefault();
    setUserSaving(true);
    try {
      if (editingId) {
        await api.patch(`/users/${editingId}`, {
          name: userForm.name,
          role: userForm.role,
          permissions: userForm.permissions,
        });
        toast.success('User permissions updated');
      } else {
        await api.post('/users', userForm);
        toast.success(`${userForm.role} account created`);
      }
      resetUserForm();
      await loadUsers();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUserSaving(false);
    }
  }

  async function toggleUser(u) {
    try {
      await api.patch(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
      loadUsers();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    try {
      await api.patch(`/users/${passwordId}/password`, { newPassword });
      toast.success('Password reset successfully');
      setPasswordId(null);
      setNewPassword('');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings', settings);
      setSettings(res.data.data.settings);
      toast.success('Settings updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', pwForm);
      toast.success('Password updated. Please log in again.');
      setPwForm({ currentPassword: '', newPassword: '' });
      setTimeout(logout, 1200);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not change password.'));
    } finally {
      setPwSaving(false);
    }
  }

  if (loading || !settings) return <LoadingSpinner full />;

  return (
    <div className="space-y-5 max-w-4xl">
      {isOwner && (
        <section className="card p-4 space-y-4">
          <div>
            <h2 className="font-display font-semibold text-ink-900">User & Manager Access</h2>
            <p className="text-sm text-ink-500 mt-1">Create staff accounts and control exactly which modules they can use.</p>
          </div>

          <form onSubmit={saveUser} className="space-y-3 border rounded-lg p-4">
            <h3 className="font-semibold">{editingId ? 'Edit staff access' : 'Create staff account'}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div><label className="label">Name</label><input required className="input" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} /></div>
              <div><label className="label">Email</label><input required type="email" disabled={Boolean(editingId)} className="input" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /></div>
              {!editingId && <div><label className="label">Initial password</label><input required minLength={8} type="password" className="input" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} /></div>}
              <div><label className="label">Role</label><select className="input" value={userForm.role} onChange={(e) => onRoleChange(e.target.value)}><option value="manager">Manager</option><option value="supervisor">Supervisor</option><option value="accountant">Accountant</option></select></div>
            </div>

            <div>
              <p className="label mb-2">Permissions</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {PERMISSIONS.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={userForm.permissions.includes(key)} onChange={() => togglePermission(key)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="btn btn-primary" disabled={userSaving}>{userSaving ? 'Saving…' : editingId ? 'Save access' : 'Create account'}</button>
              {editingId && <button type="button" className="btn btn-secondary" onClick={resetUserForm}>Cancel</button>}
            </div>
          </form>

          {usersLoading ? <LoadingSpinner /> : (
            <div className="space-y-2">
              {users.filter((u) => u.role !== 'owner').map((u) => (
                <div key={u._id} className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-medium">{u.name} <span className="text-xs ml-2 px-2 py-1 rounded bg-steel-100">{u.role}</span></p>
                    <p className="text-sm text-ink-500">{u.email} · {u.isActive ? 'Active' : 'Inactive'}</p>
                    <p className="text-xs text-ink-400 mt-1">{u.permissions?.length || 0} custom permissions</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button className="btn btn-secondary" onClick={() => editUser(u)}>Edit access</button>
                    <button className="btn btn-secondary" onClick={() => { setPasswordId(u._id); setNewPassword(''); }}>Reset password</button>
                    <button className="btn btn-secondary" onClick={() => toggleUser(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                  </div>
                </div>
              ))}
              {users.filter((u) => u.role !== 'owner').length === 0 && <p className="text-sm text-ink-500">No staff accounts yet.</p>}
            </div>
          )}

          {passwordId && (
            <form onSubmit={resetPassword} className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">Reset staff password</h3>
              <input required minLength={8} type="password" className="input" placeholder="New password (8+ characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <div className="flex gap-2"><button className="btn btn-primary">Set password</button><button type="button" className="btn btn-secondary" onClick={() => setPasswordId(null)}>Cancel</button></div>
            </form>
          )}
        </section>
      )}

      {isOwner && (
        <form onSubmit={saveSettings} className="card p-4 space-y-3">
          <h2 className="font-display font-semibold text-ink-900">Company</h2>
          <div><label className="label">Company name</label><input className="input" value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Phone</label><input className="input" value={settings.companyPhone} onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input" value={settings.companyEmail} onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })} /></div>
          </div>
          <div><label className="label">Address</label><input className="input" value={settings.companyAddress} onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })} /></div>
          <h2 className="font-display font-semibold text-ink-900 pt-2">Attendance</h2>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.weeklyOffPaid} onChange={(e) => setSettings({ ...settings, weeklyOffPaid: e.target.checked })} /> Pay wages for weekly off days</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.holidayPaid} onChange={(e) => setSettings({ ...settings, holidayPaid: e.target.checked })} /> Pay wages for holidays</label>
          <h2 className="font-display font-semibold text-ink-900 pt-2">Payroll</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Default overtime rate (₹/day)</label><input type="number" min="0" step="0.01" className="input" value={settings.defaultOvertimeRate} onChange={(e) => setSettings({ ...settings, defaultOvertimeRate: e.target.value })} /></div>
            <div><label className="label">Currency</label><select className="input" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}><option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option></select></div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
        </form>
      )}

      {!isOwner && <div className="card p-4"><h2 className="font-display font-semibold">Account</h2><p className="text-sm text-ink-500 mt-1">Company settings are managed by the owner.</p></div>}

      <form onSubmit={changePassword} className="card p-4 space-y-3">
        <h2 className="font-display font-semibold text-ink-900">My Account</h2>
        <div><label className="label">Current password</label><input type="password" required className="input" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></div>
        <div><label className="label">New password</label><input type="password" required minLength={8} className="input" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} /></div>
        <button type="submit" className="btn btn-primary" disabled={pwSaving}>{pwSaving ? 'Updating…' : 'Change password'}</button>
        <button type="button" className="btn btn-secondary ml-2" onClick={logout}>Log out</button>
      </form>
    </div>
  );
}
