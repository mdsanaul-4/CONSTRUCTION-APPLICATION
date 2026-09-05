import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/format.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import Badge from '../../components/Badge.jsx';

const ENTITY_TYPES = ['Labourer', 'Supplier', 'Project', 'Attendance', 'Payroll', 'Payment', 'Settings', 'Company', 'User'];

export default function Activity() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get('/activity', { params: { entityType: entityType || undefined, page, limit: 25 } })
      .then((res) => {
        setItems(res.data.data.items);
        setTotal(res.data.data.total);
      })
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [entityType, page]);

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-end gap-3">
        <div>
          <label className="label">Entity type</label>
          <select className="input" value={entityType} onChange={(e) => { setPage(1); setEntityType(e.target.value); }}>
            <option value="">All</option>
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No activity recorded yet" />
      ) : (
        <div className="card divide-y divide-concrete-200">
          {items.map((a) => (
            <div key={a._id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ink-900 capitalize">{a.action.replaceAll('_', ' ').toLowerCase()}</p>
                <p className="text-xs text-ink-400 mt-0.5">{a.userId?.name || 'System'} · {formatDate(a.createdAt)}</p>
              </div>
              <Badge className="bg-concrete-100 text-ink-600">{a.entityType}</Badge>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} limit={25} total={total} onPageChange={setPage} />
    </div>
  );
}
