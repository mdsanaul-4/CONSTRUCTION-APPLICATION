import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, RotateCcw, Save } from 'lucide-react';
import api, { apiErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { toDateInputValue } from '../../utils/format.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'off', label: 'Off' },
  { value: 'holiday', label: 'Holiday' },
];

const STATUS_STYLES = {
  present: 'bg-signal-green-100 text-signal-green border-signal-green/30',
  absent: 'bg-signal-rust-100 text-signal-rust border-signal-rust/30',
  half_day: 'bg-signal-amber-100 text-signal-amber border-signal-amber/30',
  off: 'bg-steel-100 text-steel-700 border-steel-700/20',
  holiday: 'bg-safety-100 text-safety-600 border-safety-500/30',
};

export default function Attendance() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('attendance.create');
  const canUpdate = hasPermission('attendance.update');
  const [date, setDate] = useState(toDateInputValue());
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [supplierId, setSupplierId] = useState('');

  const [sheet, setSheet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  useEffect(() => {
    api.get('/projects', { params: { limit: 200, status: 'active' } }).then((res) => setProjects(res.data.data.items));
    api.get('/suppliers', { params: { limit: 200, status: 'active' } }).then((res) => setSuppliers(res.data.data.items));
  }, []);

  function loadSheet() {
    setLoading(true);
    api
      .get('/attendance/sheet', { params: { date, projectId: projectId || undefined, supplierId: supplierId || undefined } })
      .then((res) => {
        setSheet(res.data.data.sheet.map((row) => ({ ...row, status: row.status || null, overtimeHours: row.overtimeHours || 0 })));
        setHasExisting(res.data.data.hasExistingEntries);
      })
      .catch((err) => toast.error(apiErrorMessage(err, 'Could not load the attendance sheet.')))
      .finally(() => setLoading(false));
  }

  useEffect(loadSheet, [date, projectId, supplierId]);

  function setRowStatus(labourerId, status) {
    setSheet((prev) => prev.map((r) => (r.labourerId === labourerId ? { ...r, status } : r)));
  }

  function setRowOt(labourerId, overtimeHours) {
    setSheet((prev) => prev.map((r) => (r.labourerId === labourerId ? { ...r, overtimeHours } : r)));
  }

  function markAll(status) {
    setSheet((prev) => prev.map((r) => ({ ...r, status })));
  }

  function resetSheet() {
    setSheet((prev) => prev.map((r) => ({ ...r, status: null, overtimeHours: 0 })));
  }

  async function save(overwrite = false) {
    const entries = sheet.filter((r) => r.status).map((r) => ({
      labourerId: r.labourerId,
      status: r.status,
      overtimeHours: Number(r.overtimeHours) || 0,
      notes: '',
    }));

    if (entries.length === 0) {
      toast.error('Mark at least one labourer before saving.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/attendance/bulk', { date, projectId: projectId || null, entries, overwrite });
      toast.success('Attendance saved');
      setConfirmOverwrite(false);
      loadSheet();
    } catch (err) {
      if (err.response?.status === 409) {
        setConfirmOverwrite(true);
      } else {
        toast.error(apiErrorMessage(err, 'Could not save attendance.'));
      }
    } finally {
      setSaving(false);
    }
  }

  const markedCount = sheet.filter((r) => r.status).length;

  return (
    <div className="space-y-4">
      {!canCreate && !canUpdate && (
        <div className="card p-4 text-sm text-ink-600">You have view-only access to attendance. Ask the owner for attendance entry permission.</div>
      )}
      {canCreate && hasExisting && !canUpdate && (
        <div className="card p-4 text-sm text-ink-600">You can record new attendance, but editing existing attendance is disabled for your account.</div>
      )}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Project</label>
          <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">All projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Supplier</label>
          <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">All suppliers</option>
            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        {hasExisting && (
          <span className="badge bg-signal-amber-100 text-signal-amber">Attendance already exists for this date — editing will update it</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn btn-secondary" onClick={() => markAll('present')} disabled={!canCreate && !canUpdate}>
          <CheckCircle2 size={15} className="text-signal-green" /> Mark all present
        </button>
        <button className="btn btn-secondary" onClick={() => markAll('absent')} disabled={!canCreate && !canUpdate}>
          <XCircle size={15} className="text-signal-rust" /> Mark all absent
        </button>
        <button className="btn btn-secondary" onClick={() => markAll('off')} disabled={!canCreate && !canUpdate}>
          <MinusCircle size={15} className="text-steel-700" /> Mark all off
        </button>
        <button className="btn btn-secondary" onClick={resetSheet} disabled={!canCreate && !canUpdate}>
          <RotateCcw size={15} /> Reset
        </button>
        <button className="btn btn-primary ml-auto" onClick={() => save(false)} disabled={saving || markedCount === 0 || !canCreate || (hasExisting && !canUpdate)}>
          <Save size={15} /> {saving ? 'Saving…' : `Save attendance (${markedCount})`}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : sheet.length === 0 ? (
        <EmptyState title="No active labourers match these filters" message="Try a different project or supplier, or add labourers first." />
      ) : (
        <div className="card divide-y divide-concrete-200">
          {sheet.map((row) => (
            <div key={row.labourerId} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-360 flex-1">
                <p className="font-medium text-ink-900">{row.name}</p>
                <p className="text-xs text-ink-400">{row.supplier || '—'} {row.project ? `· ${row.project}` : ''}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRowStatus(row.labourerId, opt.value)} disabled={!canCreate && !canUpdate}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      row.status === opt.value ? STATUS_STYLES[opt.value] : 'bg-white border-concrete-200 text-ink-600 hover:border-ink-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-xs text-ink-400 whitespace-nowrap">OT hrs</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="input w-20 py-1"
                  value={row.overtimeHours}
                  onChange={(e) => setRowOt(row.labourerId, e.target.value)} disabled={!canCreate && !canUpdate}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmOverwrite}
        onClose={() => setConfirmOverwrite(false)}
        onConfirm={() => save(true)}
        loading={saving}
        title="Attendance already exists"
        message="Attendance has already been recorded for one or more labourers on this date. Do you want to edit it with these new values?"
        confirmLabel="Edit attendance"
      />
    </div>
  );
}
