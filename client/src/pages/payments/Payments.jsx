import { useEffect, useState } from 'react';
import { Plus, Ban } from 'lucide-react';
import api, { apiErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate, toDateInputValue } from '../../utils/format.js';
import Badge from '../../components/Badge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

const emptyForm = { labourerId: '', payrollId: '', amount: '', paymentDate: toDateInputValue(), method: 'cash', referenceNumber: '', notes: '' };

export default function Payments() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [labourers, setLabourers] = useState([]);
  const [labourerFilter, setLabourerFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  useEffect(() => {
    api.get('/labourers', { params: { limit: 500, status: 'active' } }).then((res) => setLabourers(res.data.data.items));
  }, []);

  function load() {
    setLoading(true);
    api
      .get('/payments', { params: { labourerId: labourerFilter || undefined, method: methodFilter || undefined, page, limit: 15 } })
      .then((res) => {
        setItems(res.data.data.items);
        setTotal(res.data.data.total);
      })
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [labourerFilter, methodFilter, page]);

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/payments', { ...form, payrollId: form.payrollId || null });
      toast.success('Payment recorded');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not record the payment.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleVoid() {
    setVoiding(true);
    try {
      await api.post(`/payments/${voidTarget._id}/void`, { reason: voidReason });
      toast.success('Payment voided');
      setVoidTarget(null);
      setVoidReason('');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setVoiding(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={labourerFilter} onChange={(e) => { setPage(1); setLabourerFilter(e.target.value); }}>
            <option value="">All labourers</option>
            {labourers.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <select className="input w-auto" value={methodFilter} onChange={(e) => { setPage(1); setMethodFilter(e.target.value); }}>
            <option value="">All methods</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="upi">UPI</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Record payment
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No payments recorded yet" action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Record payment</button>} />
      ) : (
        <div className="overflow-x-auto card">
          <table className="w-full text-sm">
            <thead className="bg-concrete-50 text-ink-600 text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Labourer</th>
                <th className="px-4 py-2.5 font-semibold">Amount</th>
                <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Method</th>
                <th className="px-4 py-2.5 font-semibold hidden md:table-cell">Reference</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-concrete-200">
              {items.map((p) => (
                <tr key={p._id} className="hover:bg-concrete-50">
                  <td className="px-4 py-2.5">{formatDate(p.paymentDate)}</td>
                  <td className="px-4 py-2.5 font-medium text-ink-900">{p.labourerId?.name || '—'}</td>
                  <td className="px-4 py-2.5">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell capitalize">{p.method}</td>
                  <td className="px-4 py-2.5 hidden md:table-cell">{p.referenceNumber || '—'}</td>
                  <td className="px-4 py-2.5">
                    <Badge className={p.status === 'voided' ? 'bg-signal-rust-100 text-signal-rust' : 'bg-signal-green-100 text-signal-green'}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {p.status === 'active' && (
                      <button className="text-signal-rust font-medium hover:underline inline-flex items-center gap-1" onClick={() => setVoidTarget(p)}>
                        <Ban size={13} /> Void
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record payment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="payment-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record payment'}</button>
          </>
        }
      >
        <form id="payment-form" onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="label">Labourer</label>
            <select required className="input" value={form.labourerId} onChange={(e) => setForm({ ...form, labourerId: e.target.value })}>
              <option value="">Select labourer</option>
              {labourers.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹)</label>
              <input type="number" min="0.01" step="0.01" required className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Payment date</label>
              <input type="date" required className="input" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Method</label>
              <select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="upi">UPI</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Reference number</label>
              <input className="input" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(voidTarget)}
        onClose={() => setVoidTarget(null)}
        title="Void payment?"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setVoidTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleVoid} disabled={voiding || !voidReason.trim()}>{voiding ? 'Voiding…' : 'Void payment'}</button>
          </>
        }
      >
        <p className="text-sm text-ink-600 mb-3">
          This payment will be kept in history but excluded from paid/due totals. This cannot be undone.
        </p>
        <label className="label">Reason</label>
        <input className="input" required value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="e.g. entered by mistake" />
      </Modal>
    </div>
  );
}
