import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import api, { apiErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const REPORT_TYPES = [
  { value: 'attendance', label: 'Attendance report' },
  { value: 'payroll', label: 'Payroll report' },
  { value: 'supplier', label: 'Supplier report' },
  { value: 'project', label: 'Project report' },
  { value: 'payment', label: 'Payment report' },
];

export default function Reports() {
  const toast = useToast();
  const [type, setType] = useState('attendance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  function buildParams() {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (type === 'payroll') {
      if (month) params.month = month;
      if (year) params.year = year;
    }
    return params;
  }

  function runReport() {
    setLoading(true);
    api
      .get(`/reports/${type}`, { params: buildParams() })
      .then((res) => setRows(res.data.data.rows))
      .catch((err) => toast.error(apiErrorMessage(err, 'Could not generate the report.')))
      .finally(() => setLoading(false));
  }

  useEffect(runReport, [type]);

  function exportAs(format) {
    const params = new URLSearchParams(buildParams()).toString();
    const token = localStorage.getItem('clm_token');
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const url = `${base}/reports/${type}/export/${format}?${params}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${type}-report.${format === 'excel' ? 'xlsx' : format}`;
        link.click();
      })
      .catch(() => toast.error('Could not export the report.'));
  }

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Report type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {type !== 'supplier' && type !== 'project' && (
          <>
            <div>
              <label className="label">Start date</label>
              <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="label">End date</label>
              <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </>
        )}
        {type === 'payroll' && (
          <>
            <div>
              <label className="label">Month</label>
              <input type="number" min="1" max="12" className="input w-20" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div>
              <label className="label">Year</label>
              <input type="number" className="input w-24" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
          </>
        )}
        <button className="btn btn-primary" onClick={runReport} disabled={loading}>
          {loading ? 'Running…' : 'Run report'}
        </button>

        <div className="flex gap-2 ml-auto">
          <button className="btn btn-secondary" onClick={() => exportAs('excel')} title="Export Excel">
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button className="btn btn-secondary" onClick={() => exportAs('csv')} title="Export CSV">
            <Download size={15} /> CSV
          </button>
          <button className="btn btn-secondary" onClick={() => exportAs('pdf')} title="Export PDF">
            <FileText size={15} /> PDF
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()} title="Print">
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No data for the selected filters" />
      ) : (
        <div className="overflow-x-auto card">
          <table className="w-full text-sm">
            <thead className="bg-concrete-50 text-ink-600 text-left">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-4 py-2.5 font-semibold capitalize">{c.replace(/([A-Z])/g, ' $1')}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-concrete-200">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-concrete-50">
                  {columns.map((c) => (
                    <td key={c} className="px-4 py-2.5 text-ink-900">{String(row[c])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
