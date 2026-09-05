import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import api, { apiErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import SearchBar from '../../components/SearchBar.jsx';
import Pagination from '../../components/Pagination.jsx';
import Modal from '../../components/Modal.jsx';
import Badge from '../../components/Badge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const emptyForm = { name: '', phone: '', address: '', notes: '', status: 'active' };

export default function SuppliersList() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .get('/suppliers', { params: { search, status: statusFilter, page, limit: 12 } })
      .then((res) => {
        setItems(res.data.data.items);
        setTotal(res.data.data.total);
      })
      .catch((err) => toast.error(apiErrorMessage(err, 'Could not load suppliers.')))
      .finally(() => setLoading(false));
  }

  useEffect(load, [search, statusFilter, page]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(s) {
    setEditing(s);
    setForm({ name: s.name, phone: s.phone || '', address: s.address || '', notes: s.notes || '', status: s.status });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/suppliers/${editing._id}`, form);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', form);
        toast.success('Supplier added');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the supplier.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1">
          <SearchBar value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search suppliers…" />
          <select className="input w-auto" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> New supplier
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No suppliers yet" message="Add the labour suppliers you work with." action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New supplier</button>} />
      ) : (
        <div className="overflow-x-auto card">
          <table className="w-full text-sm">
            <thead className="bg-concrete-50 text-ink-600 text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Name</th>
                <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Phone</th>
                <th className="px-4 py-2.5 font-semibold hidden md:table-cell">Address</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-concrete-200">
              {items.map((s) => (
                <tr key={s._id} className="hover:bg-concrete-50">
                  <td className="px-4 py-2.5">
                    <Link to={`/suppliers/${s._id}`} className="flex items-center gap-2 font-medium text-ink-900 hover:underline">
                      <Users size={14} className="text-steel-700" /> {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-ink-600">{s.phone || '—'}</td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-ink-600">{s.address || '—'}</td>
                  <td className="px-4 py-2.5">
                    <Badge className={s.status === 'active' ? 'bg-signal-green-100 text-signal-green' : 'bg-concrete-100 text-ink-600'}>{s.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button className="text-steel-700 font-medium hover:underline" onClick={() => openEdit(s)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} limit={12} total={total} onPageChange={setPage} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit supplier' : 'New supplier'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="supplier-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save supplier'}</button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="label">Supplier name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
