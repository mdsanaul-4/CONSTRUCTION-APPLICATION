import { useEffect, useState } from 'react';
import { Wallet, Lock, Unlock, RefreshCw } from 'lucide-react';
import api, { apiErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, PAYROLL_STATUS_COLORS, MONTH_NAMES } from '../../utils/format.js';
import Badge from '../../components/Badge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Modal from '../../components/Modal.jsx';

const now = new Date();

export default function Payroll() {
  const toast = useToast();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [projectId, setProjectId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [confirm, setConfirm] = useState(null); // { type: 'finalize'|'reopen', payroll }
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ otherEarnings: 0, deductions: 0 });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    api.get('/projects', { params: { limit: 200 } }).then((res) => setProjects(res.data.data.items));
    api.get('/suppliers', { params: { limit: 200 } }).then((res) => setSuppliers(res.data.data.items));
  }, []);

  function load() {
    setLoading(true);
    api
      .get('/payroll', { params: { month, year, projectId: projectId || undefined, supplierId: supplierId || undefined, status: statusFilter || undefined, page, limit: 15 } })
      .then((res) => {
        setItems(res.data.data.items);
        setTotal(res.data.data.total);
      })
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [month, year, projectId, supplierId, statusFilter, page]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await api.post('/payroll/generate', { month, year, projectId: projectId || undefined, supplierId: supplierId || undefined });
      toast.success(`Payroll generated for ${res.data.data.count} labourer(s)`);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not generate payroll.'));
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirm() {
    if (!confirm) return;
    try {
      if (confirm.type === 'finalize') {
        await api.post(`/payroll/${confirm.payroll._id}/finalize`);
        toast.success('Payroll finalized');
      } else {
        await api.post(`/payroll/${confirm.payroll._id}/reopen`);
        toast.success('Payroll reopened for editing');
      }
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  function openEdit(p) {
    setEditModal(p);
    setEditForm({ otherEarnings: p.otherEarnings, deductions: p.deductions });
  }

  async function saveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await api.put(`/payroll/${editModal._id}`, editForm);
      toast.success('Payroll draft updated');
      setEditModal(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Month</label>
          <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <input type="number" className="input w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
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
        <div>
          <label className="label">Status</label>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="finalized">Finalized</option>
            <option value="partially_paid">Partially paid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <button className="btn btn-primary ml-auto" onClick={handleGenerate} disabled={generating}>
          <Wallet size={15} /> {generating ? 'Generating…' : 'Generate payroll'}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No payroll for this period" message="Generate payroll for the selected month to calculate wages from attendance." />
      ) : (
        <div className="overflow-x-auto card">
          <table className="w-full text-sm">
            <thead className="bg-concrete-50 text-ink-600 text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Labourer</th>
                <th className="px-4 py-2.5 font-semibold">Present</th>
                <th className="px-4 py-2.5 font-semibold">OT hrs</th>
                <th className="px-4 py-2.5 font-semibold">Gross</th>
                <th className="px-4 py-2.5 font-semibold">Paid</th>
                <th className="px-4 py-2.5 font-semibold">Due</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-concrete-200">
              {items.map((p) => (
                <tr key={p._id} className="hover:bg-concrete-50">
                  <td className="px-4 py-2.5 font-medium text-ink-900">{p.labourerId?.name || '—'}</td>
                  <td className="px-4 py-2.5">{p.presentDays}</td>
                  <td className="px-4 py-2.5">{p.overtimeHours}</td>
                  <td className="px-4 py-2.5">{formatCurrency(p.grossAmount)}</td>
                  <td className="px-4 py-2.5">{formatCurrency(p.paidAmount)}</td>
                  <td className="px-4 py-2.5">{formatCurrency(p.dueAmount)}</td>
                  <td className="px-4 py-2.5"><Badge className={PAYROLL_STATUS_COLORS[p.status]}>{p.status.replace('_', ' ')}</Badge></td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {p.status === 'draft' ? (
                      <>
                        <button className="text-steel-700 font-medium hover:underline mr-3" onClick={() => openEdit(p)}>Edit</button>
                        <button className="text-signal-green font-medium hover:underline" onClick={() => setConfirm({ type: 'finalize', payroll: p })}>
                          Finalize
                        </button>
                      </>
                    ) : (
                      <button className="text-steel-700 font-medium hover:underline" onClick={() => setConfirm({ type: 'reopen', payroll: p })}>
                        Reopen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} limit={15} total={total} onPageChange={setPage} />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirm}
        title={confirm?.type === 'finalize' ? 'Finalize payroll?' : 'Reopen payroll?'}
        message={
          confirm?.type === 'finalize'
            ? 'Once finalized, this payroll record is locked. Rates and totals are snapshotted and won\u2019t change even if the labourer\u2019s rate changes later.'
            : 'This will unlock the payroll record for editing. Its status will return to draft.'
        }
        confirmLabel={confirm?.type === 'finalize' ? 'Finalize' : 'Reopen'}
      />

      <Modal
        open={Boolean(editModal)}
        onClose={() => setEditModal(null)}
        title="Edit payroll draft"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
            <button className="btn btn-primary" form="payroll-edit-form" type="submit" disabled={savingEdit}>{savingEdit ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <form id="payroll-edit-form" onSubmit={saveEdit} className="space-y-3">
          <div>
            <label className="label">Other earnings (₹)</label>
            <input type="number" step="0.01" className="input" value={editForm.otherEarnings} onChange={(e) => setEditForm({ ...editForm, otherEarnings: e.target.value })} />
          </div>
          <div>
            <label className="label">Deductions (₹)</label>
            <input type="number" step="0.01" className="input" value={editForm.deductions} onChange={(e) => setEditForm({ ...editForm, deductions: e.target.value })} />
          </div>
          <p className="text-xs text-ink-400">Present, OT, and basic pay are recalculated automatically from attendance and cannot be edited directly.</p>
        </form>
      </Modal>
    </div>
  );
}
