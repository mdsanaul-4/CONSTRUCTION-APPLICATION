import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, HardHat } from 'lucide-react';
import api, { apiErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import SearchBar from '../../components/SearchBar.jsx';
import Pagination from '../../components/Pagination.jsx';
import Modal from '../../components/Modal.jsx';
import Badge from '../../components/Badge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatDate } from '../../utils/format.js';

const STATUS_BADGE = {
  active: 'bg-signal-green-100 text-signal-green',
  completed: 'bg-steel-100 text-steel-700',
  on_hold: 'bg-signal-amber-100 text-signal-amber',
};

const emptyForm = { name: '', clientName: '', location: '', description: '', startDate: '', expectedEndDate: '', status: 'active' };

export default function ProjectsList() {
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
      .get('/projects', { params: { search, status: statusFilter, page, limit: 12 } })
      .then((res) => {
        setItems(res.data.data.items);
        setTotal(res.data.data.total);
      })
      .catch((err) => toast.error(apiErrorMessage(err, 'Could not load projects.')))
      .finally(() => setLoading(false));
  }

  useEffect(load, [search, statusFilter, page]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(project) {
    setEditing(project);
    setForm({
      name: project.name || '',
      clientName: project.clientName || '',
      location: project.location || '',
      description: project.description || '',
      startDate: project.startDate ? project.startDate.slice(0, 10) : '',
      expectedEndDate: project.expectedEndDate ? project.expectedEndDate.slice(0, 10) : '',
      status: project.status,
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/projects/${editing._id}`, form);
        toast.success('Project updated');
      } else {
        await api.post('/projects', form);
        toast.success('Project created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save the project.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1">
          <SearchBar value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="Search projects…" />
          <select className="input w-auto" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> New project
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState
          title="No projects yet"
          message="Create your first project to start tracking labourers, attendance and cost by site."
          action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New project</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((p) => (
            <div key={p._id} className="card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-steel-100 flex items-center justify-center shrink-0">
                    <HardHat size={16} className="text-steel-700" />
                  </div>
                  <Link to={`/projects/${p._id}`} className="font-display font-semibold text-ink-900 hover:underline truncate">
                    {p.name}
                  </Link>
                </div>
                <Badge className={STATUS_BADGE[p.status]}>{p.status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-sm text-ink-600">{p.clientName || 'No client set'}</p>
              <p className="text-xs text-ink-400">{p.location || 'No location set'}</p>
              <div className="flex items-center justify-between mt-auto pt-2 text-xs text-ink-400">
                <span>Started {formatDate(p.startDate)}</span>
                <button className="text-steel-700 font-medium hover:underline" onClick={() => openEdit(p)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} limit={12} total={total} onPageChange={setPage} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit project' : 'New project'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="project-form" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save project'}
            </button>
          </>
        }
      >
        <form id="project-form" onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="label">Project name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Client name</label>
              <input className="input" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start date</label>
              <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Expected end date</label>
              <input type="date" className="input" value={form.expectedEndDate} onChange={(e) => setForm({ ...form, expectedEndDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
