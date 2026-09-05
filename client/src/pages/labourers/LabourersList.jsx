import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UserCircle } from 'lucide-react';
import api, { apiErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import SearchBar from '../../components/SearchBar.jsx';
import Pagination from '../../components/Pagination.jsx';
import Modal from '../../components/Modal.jsx';
import Badge from '../../components/Badge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatCurrency } from '../../utils/format.js';

const emptyForm = {
  name: '', phone: '', address: '', supplierId: '', projectId: '',
  dailyRate: '', overtimeRate: '', joiningDate: '', status: 'active', notes: '', photo: '',
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function LabourersList() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('labourers.create');
  const canEdit = hasPermission('labourers.update');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/suppliers', { params: { limit: 200, status: 'active' } }).then((res) => setSuppliers(res.data.data.items));
    api.get('/projects', { params: { limit: 200, status: 'active' } }).then((res) => setProjects(res.data.data.items));
  }, []);

  function load() {
    setLoading(true);
    api
      .get('/labourers', { params: { search, status: statusFilter, supplierId: supplierFilter, projectId: projectFilter, page, limit: 12 } })
      .then((res) => {
        setItems(res.data.data.items);
        setTotal(res.data.data.total);
      })
      .catch((err) => toast.error(apiErrorMessage(err, 'Could not load labourers.')))
      .finally(() => setLoading(false));
  }

  useEffect(load, [search, statusFilter, supplierFilter, projectFilter, page]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(l) {
    setEditing(l);
    setForm({
      name: l.name, phone: l.phone || '', address: l.address || '',
      supplierId: l.supplierId?._id || '', projectId: l.projectId?._id || '',
      dailyRate: l.dailyRate, overtimeRate: l.overtimeRate,
      joiningDate: l.joiningDate ? l.joiningDate.slice(0, 10) : '',
      status: l.status, notes: l.notes || '', photo: l.photo || '',
    });
    setModalOpen(true);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Photo must be smaller than 4MB.');
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setForm((prev) => ({ ...prev, photo: dataUrl }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, supplierId: form.supplierId || null, projectId: form.projectId || null };
      if (editing) {
        await api.put(`/labourers/${editing._id}`, payload);
        toast.success('Labourer updated');
      } else {
        await api.post('/labourers', payload);
        toast.success('Labourer added');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the labourer.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <SearchBar value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search labourers…" />
          <select className="input w-auto" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="input w-auto" value={supplierFilter} onChange={(e) => { setPage(1); setSupplierFilter(e.target.value); }}>
            <option value="">All suppliers</option>
            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select className="input w-auto" value={projectFilter} onChange={(e) => { setPage(1); setProjectFilter(e.target.value); }}>
            <option value="">All projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        {canCreate && <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> New labourer
        </button>}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No labourers yet" message="Add your workers to start tracking attendance and pay." action={canCreate &&  <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New labourer</button> } /> 
      ) : (
        <div className="overflow-x-auto card">
          <table className="w-full text-sm">
            <thead className="bg-concrete-50 text-ink-600 text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Name</th>
                <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Supplier</th>
                <th className="px-4 py-2.5 font-semibold hidden md:table-cell">Project</th>
                <th className="px-4 py-2.5 font-semibold">Daily rate</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-concrete-200">
              {items.map((l) => (
                <tr key={l._id} className="hover:bg-concrete-50">
                  <td className="px-4 py-2.5">
                    <Link to={`/labourers/${l._id}`} className="flex items-center gap-2 font-medium text-ink-900 hover:underline">
                      {l.photo ? (
                        <img src={l.photo} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <UserCircle size={20} className="text-steel-700" />
                      )}
                      {l.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-ink-600">{l.supplierId?.name || '—'}</td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-ink-600">{l.projectId?.name || '—'}</td>
                  <td className="px-4 py-2.5 text-ink-600">{formatCurrency(l.dailyRate)}</td>
                  <td className="px-4 py-2.5">
                    <Badge className={l.status === 'active' ? 'bg-signal-green-100 text-signal-green' : 'bg-concrete-100 text-ink-600'}>{l.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {canEdit && <button className="text-steel-700 font-medium hover:underline" onClick={() => openEdit(l)}>Edit</button>}
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
        title={editing ? 'Edit labourer' : 'New labourer'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="labourer-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save labourer'}</button>
          </>
        }
      >
        <form id="labourer-form" onSubmit={handleSave} className="space-y-3">
          <div className="flex items-center gap-3">
            {form.photo ? (
              <img src={form.photo} alt="" className="w-14 h-14 rounded-full object-cover border border-concrete-200" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-concrete-100 flex items-center justify-center text-ink-400 text-xs">No photo</div>
            )}
            <div>
              <label className="label">Photo</label>
              <input type="file" accept="image/*" className="text-sm" onChange={handlePhotoChange} />
            </div>
          </div>
          <div>
            <label className="label">Full name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Joining date</label>
              <input type="date" className="input" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Supplier</label>
              <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">None</option>
                {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Project</label>
              <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                <option value="">None</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Daily rate (₹)</label>
              <input type="number" min="0" step="0.01" required className="input" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} />
            </div>
            <div>
              <label className="label">Overtime rate / hr (₹)</label>
              <input type="number" min="0" step="0.01" className="input" value={form.overtimeRate} onChange={(e) => setForm({ ...form, overtimeRate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
