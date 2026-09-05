import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../services/api.js';
import { formatCurrency, formatDate, STATUS_LABELS } from '../../utils/format.js';
import StatCard from '../../components/StatCard.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorState from '../../components/ErrorState.jsx';

export default function ProjectDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  function load() {
    setStatus('loading');
    api
      .get(`/projects/${id}/summary`)
      .then((res) => {
        setData(res.data.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  useEffect(load, [id]);

  if (status === 'loading') return <LoadingSpinner full />;
  if (status === 'error') return <ErrorState message="Could not load project." onRetry={load} />;

  const { project, labourerCount, attendanceBreakdown, labourCost, paid, due } = data;
  const breakdownMap = Object.fromEntries(attendanceBreakdown.map((b) => [b._id, b.count]));

  return (
    <div className="space-y-5">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-steel-700 font-medium hover:underline">
        <ArrowLeft size={15} /> Back to projects
      </Link>

      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900">{project.name}</h1>
        <p className="text-ink-600 text-sm mt-1">{project.clientName || 'No client'} · {project.location || 'No location'}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active labourers" value={labourerCount} accent="steel" />
        <StatCard label="Labour cost" value={formatCurrency(labourCost)} accent="steel" />
        <StatCard label="Paid" value={formatCurrency(paid)} accent="green" />
        <StatCard label="Outstanding" value={formatCurrency(due)} accent="rust" />
      </div>

      <div className="card p-4">
        <h2 className="font-display font-semibold text-ink-900 mb-3">Attendance breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="text-center p-3 rounded-md bg-concrete-50">
              <p className="text-2xl font-display font-bold text-ink-900">{breakdownMap[key] || 0}</p>
              <p className="text-xs text-ink-600 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-display font-semibold text-ink-900 mb-3">Project details</h2>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-ink-400">Start date</dt>
            <dd className="text-ink-900">{formatDate(project.startDate)}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Expected end date</dt>
            <dd className="text-ink-900">{formatDate(project.expectedEndDate)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-ink-400">Description</dt>
            <dd className="text-ink-900">{project.description || '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
