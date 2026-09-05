import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../services/api.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import StatCard from '../../components/StatCard.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function SupplierDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  function load() {
    setStatus('loading');
    api.get(`/suppliers/${id}/summary`).then((res) => {
      setData(res.data.data);
      setStatus('ready');
    }).catch(() => setStatus('error'));
  }

  useEffect(load, [id]);

  if (status === 'loading') return <LoadingSpinner full />;
  if (status === 'error') return <ErrorState message="Could not load supplier." onRetry={load} />;

  const { supplier, labourers, totalSalary, paid, due, recentPayments } = data;

  return (
    <div className="space-y-5">
      <Link to="/suppliers" className="inline-flex items-center gap-1.5 text-sm text-steel-700 font-medium hover:underline">
        <ArrowLeft size={15} /> Back to suppliers
      </Link>

      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900">{supplier.name}</h1>
        <p className="text-ink-600 text-sm mt-1">{supplier.phone || 'No phone'} · {supplier.address || 'No address'}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Labourers supplied" value={labourers.length} accent="steel" />
        <StatCard label="Total salary" value={formatCurrency(totalSalary)} accent="steel" />
        <StatCard label="Paid" value={formatCurrency(paid)} accent="green" />
        <StatCard label="Outstanding" value={formatCurrency(due)} accent="rust" />
      </div>

      <div className="card p-4">
        <h2 className="font-display font-semibold text-ink-900 mb-3">Labourers</h2>
        {labourers.length === 0 ? (
          <EmptyState title="No labourers linked yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-ink-600 text-left border-b border-concrete-200">
                <tr><th className="py-2 font-semibold">Name</th><th className="py-2 font-semibold">Daily rate</th><th className="py-2 font-semibold">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-concrete-200">
                {labourers.map((l) => (
                  <tr key={l._id}>
                    <td className="py-2"><Link to={`/labourers/${l._id}`} className="text-steel-700 hover:underline font-medium">{l.name}</Link></td>
                    <td className="py-2">{formatCurrency(l.dailyRate)}</td>
                    <td className="py-2 capitalize">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-4">
        <h2 className="font-display font-semibold text-ink-900 mb-3">Recent payments</h2>
        {recentPayments.length === 0 ? (
          <EmptyState title="No payments yet" />
        ) : (
          <ul className="divide-y divide-concrete-200">
            {recentPayments.map((p) => (
              <li key={p._id} className="py-2 flex justify-between text-sm">
                <span className="text-ink-900">{formatDate(p.paymentDate)}</span>
                <span className="font-semibold text-ink-900">{formatCurrency(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
