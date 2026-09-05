import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Power } from 'lucide-react';
import api, { apiErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate, STATUS_LABELS, PAYROLL_STATUS_COLORS } from '../../utils/format.js';
import StatCard from '../../components/StatCard.jsx';
import Badge from '../../components/Badge.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

const TABS = ['Overview', 'Attendance', 'Payroll', 'Payments', 'Activity'];

export default function LabourerProfile() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [tab, setTab] = useState('Overview');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  function load() {
    setStatus('loading');
    api.get(`/labourers/${id}/profile`).then((res) => {
      setData(res.data.data);
      setStatus('ready');
    }).catch(() => setStatus('error'));
  }

  useEffect(load, [id]);

  async function toggleStatus() {
    setToggling(true);
    try {
      const nextStatus = data.labourer.status === 'active' ? 'inactive' : 'active';
      await api.patch(`/labourers/${id}/status`, { status: nextStatus });
      toast.success(`Labourer marked ${nextStatus}`);
      setConfirmOpen(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setToggling(false);
    }
  }

  if (status === 'loading') return <LoadingSpinner full />;
  if (status === 'error') return <ErrorState message="Could not load labourer." onRetry={load} />;

  const { labourer, totals, totalSalary, totalPaid, totalDue, payrolls, payments, activity } = data;

  return (
    <div className="space-y-5">
      <Link to="/labourers" className="inline-flex items-center gap-1.5 text-sm text-steel-700 font-medium hover:underline">
        <ArrowLeft size={15} /> Back to labourers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {labourer.photo ? (
            <img src={labourer.photo} alt="" className="w-16 h-16 rounded-full object-cover border border-concrete-200" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-concrete-100 flex items-center justify-center text-ink-400 text-xs">No photo</div>
          )}
          <div>
            <h1 className="font-display font-bold text-2xl text-ink-900">{labourer.name}</h1>
            <p className="text-ink-600 text-sm mt-1">
              {labourer.supplierId?.name || 'No supplier'} · {labourer.projectId?.name || 'No project'}
            </p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => setConfirmOpen(true)}>
          <Power size={15} /> {labourer.status === 'active' ? 'Deactivate' : 'Reactivate'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total working days" value={totals.presentDays} accent="green" />
        <StatCard label="Total overtime" value={`${totals.overtimeHours} hrs`} accent="safety" />
        <StatCard label="Total salary" value={formatCurrency(totalSalary)} accent="steel" />
        <StatCard label="Total due" value={formatCurrency(totalDue)} accent="rust" />
      </div>

      <div className="border-b border-concrete-200 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
              tab === t ? 'border-safety-500 text-ink-900' : 'border-transparent text-ink-400 hover:text-ink-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-4">
            <h2 className="font-display font-semibold text-ink-900 mb-3">Personal information</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Phone" value={labourer.phone || '—'} />
              <Row label="Address" value={labourer.address || '—'} />
              <Row label="Status" value={<Badge className={labourer.status === 'active' ? 'bg-signal-green-100 text-signal-green' : 'bg-concrete-100 text-ink-600'}>{labourer.status}</Badge>} />
            </dl>
          </div>
          <div className="card p-4">
            <h2 className="font-display font-semibold text-ink-900 mb-3">Work & salary information</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Daily rate" value={formatCurrency(labourer.dailyRate)} />
              <Row label="Overtime rate / hr" value={formatCurrency(labourer.overtimeRate)} />
              <Row label="Joining date" value={formatDate(labourer.joiningDate)} />
              <Row label="Leaving date" value={formatDate(labourer.leavingDate)} />
            </dl>
          </div>
          <div className="card p-4 sm:col-span-2">
            <h2 className="font-display font-semibold text-ink-900 mb-3">Attendance summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <div key={key} className="text-center p-3 rounded-md bg-concrete-50">
                  <p className="text-2xl font-display font-bold text-ink-900">
                    {key === 'half_day' ? totals.halfDays : totals[`${key}Days`] || 0}
                  </p>
                  <p className="text-xs text-ink-600 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Payroll' && (
        <div className="card p-4">
          {payrolls.length === 0 ? <EmptyState title="No payroll generated yet" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-ink-600 text-left border-b border-concrete-200">
                  <tr>
                    <th className="py-2 font-semibold">Month</th>
                    <th className="py-2 font-semibold">Gross</th>
                    <th className="py-2 font-semibold">Paid</th>
                    <th className="py-2 font-semibold">Due</th>
                    <th className="py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-concrete-200">
                  {payrolls.map((p) => (
                    <tr key={p._id}>
                      <td className="py-2">{p.month}/{p.year}</td>
                      <td className="py-2">{formatCurrency(p.grossAmount)}</td>
                      <td className="py-2">{formatCurrency(p.paidAmount)}</td>
                      <td className="py-2">{formatCurrency(p.dueAmount)}</td>
                      <td className="py-2"><Badge className={PAYROLL_STATUS_COLORS[p.status]}>{p.status.replace('_', ' ')}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'Payments' && (
        <div className="card p-4">
          {payments.length === 0 ? <EmptyState title="No payments recorded yet" /> : (
            <ul className="divide-y divide-concrete-200">
              {payments.map((p) => (
                <li key={p._id} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <p className="text-ink-900">{formatDate(p.paymentDate)} · {p.method}</p>
                    {p.status === 'voided' && <p className="text-xs text-signal-rust">Voided{p.voidReason ? `: ${p.voidReason}` : ''}</p>}
                  </div>
                  <span className={`font-semibold ${p.status === 'voided' ? 'line-through text-ink-400' : 'text-ink-900'}`}>{formatCurrency(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'Attendance' && (
        <div className="card p-4">
          <p className="text-sm text-ink-600">
            Detailed day-by-day attendance for this labourer can be filtered and reviewed from the{' '}
            <Link to={`/reports?type=attendance&labourerId=${id}`} className="text-steel-700 font-medium hover:underline">
              Attendance report
            </Link>.
          </p>
        </div>
      )}

      {tab === 'Activity' && (
        <div className="card p-4">
          {activity.length === 0 ? <EmptyState title="No activity recorded yet" /> : (
            <ul className="divide-y divide-concrete-200">
              {activity.map((a) => (
                <li key={a._id} className="py-2.5 text-sm">
                  <p className="text-ink-900">{a.action.replaceAll('_', ' ').toLowerCase()}</p>
                  <p className="text-ink-400 text-xs">{formatDate(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={toggleStatus}
        loading={toggling}
        danger={labourer.status === 'active'}
        title={labourer.status === 'active' ? 'Deactivate labourer?' : 'Reactivate labourer?'}
        message={
          labourer.status === 'active'
            ? 'This labourer will be marked inactive. Their attendance, payroll, and payment history will be preserved.'
            : 'This labourer will be marked active again and appear in the attendance sheet.'
        }
        confirmLabel={labourer.status === 'active' ? 'Deactivate' : 'Reactivate'}
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-400">{label}</dt>
      <dd className="text-ink-900 text-right">{value}</dd>
    </div>
  );
}
