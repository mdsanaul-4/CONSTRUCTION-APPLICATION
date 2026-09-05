import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api.js';
import { formatCurrency, formatDate, STATUS_LABELS } from '../../utils/format.js';
import StatCard from '../../components/StatCard.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Link } from 'react-router-dom';

const ATTENDANCE_COLORS = {
  present: '#3f7d45',
  absent: '#b3412a',
  off: '#3a5a7a',
  half_day: '#b8860b',
  holiday: '#e8590c',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState([]);
  const [status, setStatus] = useState('loading');

  function load() {
    setStatus('loading');
    Promise.all([api.get('/dashboard'), api.get('/dashboard/trend')])
      .then(([dashRes, trendRes]) => {
        setData(dashRes.data.data);
        setTrend(trendRes.data.data.series);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  useEffect(load, []);

  if (status === 'loading') return <LoadingSpinner full label="Loading dashboard…" />;
  if (status === 'error') return <ErrorState message="Could not load the dashboard." onRetry={load} />;

  const { cards, todayAttendanceBreakdown, recentPayments, recentActivity } = data;

  const pieData = Object.entries(todayAttendanceBreakdown)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: STATUS_LABELS[key] || key, key, value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total labourers" value={cards.totalLabourers} sublabel={`${cards.activeLabourers} active`} accent="steel" />
        <StatCard label="Present today" value={cards.presentToday} accent="green" />
        <StatCard label="Absent today" value={cards.absentToday} accent="rust" />
        <StatCard label="Off today" value={cards.offToday} accent="steel" />
        <StatCard label="Half day today" value={cards.halfDayToday} accent="amber" />
        <StatCard label="OT hours today" value={cards.overtimeHoursToday} accent="safety" />
        <StatCard label="This month's labour cost" value={formatCurrency(cards.monthLabourCost)} accent="steel" />
        <StatCard label="Outstanding this month" value={formatCurrency(cards.monthOutstandingAmount)} sublabel={`Paid ${formatCurrency(cards.monthPaidAmount)}`} accent="rust" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <h2 className="font-display font-semibold text-ink-900 mb-3">Monthly labour cost (last 6 months)</h2>
          {trend.every((t) => t.grossAmount === 0) ? (
            <EmptyState title="No payroll history yet" message="Generate payroll to see cost trends here." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd8ca" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="grossAmount" name="Labour cost" fill="#2b4560" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-display font-semibold text-ink-900 mb-3">Today's attendance</h2>
          {pieData.length === 0 ? (
            <EmptyState title="No attendance marked yet" message="Mark today's attendance to see the breakdown." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={ATTENDANCE_COLORS[entry.key] || '#8a8371'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {pieData.map((entry) => (
                  <span key={entry.key} className="flex items-center gap-1.5 text-xs text-ink-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ATTENDANCE_COLORS[entry.key] || '#8a8371' }} />
                    {entry.name} ({entry.value})
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-ink-900">Recent payments</h2>
            <Link to="/payments" className="text-sm text-steel-700 font-medium hover:underline">View all</Link>
          </div>
          {recentPayments.length === 0 ? (
            <EmptyState title="No payments yet" />
          ) : (
            <ul className="divide-y divide-concrete-200">
              {recentPayments.map((p) => (
                <li key={p._id} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-ink-900">{p.labourerId?.name || 'Unknown'}</p>
                    <p className="text-ink-400 text-xs">{formatDate(p.paymentDate)} · {p.method}</p>
                  </div>
                  <span className="font-semibold text-ink-900">{formatCurrency(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-ink-900">Recent activity</h2>
            <Link to="/activity" className="text-sm text-steel-700 font-medium hover:underline">View all</Link>
          </div>
          {recentActivity.length === 0 ? (
            <EmptyState title="No activity recorded yet" />
          ) : (
            <ul className="divide-y divide-concrete-200">
              {recentActivity.map((a) => (
                <li key={a._id} className="py-2.5 text-sm">
                  <p className="text-ink-900">{a.action.replaceAll('_', ' ').toLowerCase()}</p>
                  <p className="text-ink-400 text-xs">{formatDate(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
