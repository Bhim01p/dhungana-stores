import { useEffect, useMemo, useState } from 'react';
import { adminStatsApi, type SalesReport, type SalesReportPeriod } from '../api/adminStats';

const money = (value: number) => `NPR ${value.toLocaleString('en-NP', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const rangeOptions: Array<{ value: SalesReportPeriod; label: string }> = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
];

function labelFor(bucket: string, granularity: 'day' | 'month') {
  const date = new Date(granularity === 'month' ? `${bucket}-01T00:00:00Z` : `${bucket}T00:00:00Z`);
  return new Intl.DateTimeFormat('en-NP', granularity === 'month' ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' }).format(date);
}

export default function AdminSalesChart({ token }: { token: string }) {
  const [period, setPeriod] = useState<SalesReportPeriod>('7d');
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    adminStatsApi.getSalesReport(token, period)
      .then(data => { if (active) setReport(data); })
      .catch(err => { if (active) setError((err as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, period]);

  const chart = useMemo(() => {
    if (!report?.buckets.length) return null;
    const width = 820, height = 290, left = 76, right = 18, top = 16, bottom = 42;
    const plotWidth = width - left - right, plotHeight = height - top - bottom;
    const values = report.buckets.flatMap(point => [point.revenue, point.cash, point.qr, point.onlineRevenue]);
    const max = Math.max(1, ...values);
    const x = (index: number) => left + (report.buckets.length === 1 ? plotWidth / 2 : index * plotWidth / (report.buckets.length - 1));
    const y = (value: number) => top + plotHeight - value / max * plotHeight;
    const pathFor = (key: 'revenue' | 'cash' | 'qr' | 'onlineRevenue') => report.buckets.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(point[key]).toFixed(2)}`).join(' ');
    const labelEvery = Math.max(1, Math.ceil(report.buckets.length / 6));
    return { width, height, left, right, top, bottom, plotWidth, plotHeight, max, x, y, pathFor, labelEvery };
  }, [report]);

  return <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4 md:px-6">
      <div><h2 className="font-bold text-stone-900">Sales overview</h2><p className="text-sm text-stone-500">Paid online orders and completed in-store sales. House use is excluded from revenue.</p></div>
      <div className="flex flex-wrap gap-1 rounded-xl bg-stone-100 p-1" role="group" aria-label="Sales chart date range">
        {rangeOptions.map(option => <button key={option.value} type="button" aria-pressed={period === option.value} onClick={() => setPeriod(option.value)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${period === option.value ? 'bg-white text-brand-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}>{option.label}</button>)}
      </div>
    </div>
    {loading ? <div className="p-8 text-center text-sm text-stone-500">Loading sales summary…</div> : error ? <div role="alert" className="m-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</div> : report && <>
      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 xl:grid-cols-5 md:px-6">
        <div className="rounded-xl bg-brand-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-brand-800">Total collected</p><p className="mt-1 text-lg font-bold text-stone-900">{money(report.totals.revenue)}</p><p className="text-xs text-stone-500">{report.totals.transactions} transactions</p></div>
        <div className="rounded-xl bg-sky-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-sky-800">In-store cash</p><p className="mt-1 text-lg font-bold text-stone-900">{money(report.totals.cash)}</p></div>
        <div className="rounded-xl bg-violet-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-violet-800">In-store QR</p><p className="mt-1 text-lg font-bold text-stone-900">{money(report.totals.qr)}</p></div>
        <div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Online paid</p><p className="mt-1 text-lg font-bold text-stone-900">{money(report.totals.onlineRevenue)}</p></div>
        <div className="rounded-xl bg-amber-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-amber-900">House use</p><p className="mt-1 text-lg font-bold text-stone-900">{money(report.totals.houseUseValue)}</p><p className="text-xs text-stone-500">{report.totals.houseUseCount} records · excluded</p></div>
      </div>
      {chart && <div className="px-2 pb-4 sm:px-5 md:px-6">
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 px-3 text-xs font-semibold text-stone-600" aria-label="Chart legend">
          <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-brand-700"/>Total revenue</span>
          <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500"/>Paid online orders</span>
          <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-sky-500"/>Cash</span>
          <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-violet-500"/>QR</span>
        </div>
        <div className="w-full overflow-hidden">
          <svg className="h-auto w-full" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={`Store revenue and payment breakdown for ${period}`}>
            {[0, 1, 2, 3].map(step => { const value = chart.max * (3 - step) / 3; const y = chart.top + chart.plotHeight * step / 3; return <g key={step}><line x1={chart.left} x2={chart.width - chart.right} y1={y} y2={y} stroke="#e7e5e4" strokeDasharray="4 5"/><text x={chart.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#78716c">{value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : Math.round(value)}</text></g>; })}
            <path d={chart.pathFor('revenue')} fill="none" stroke="#9a1b1b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
            <path d={chart.pathFor('cash')} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
            <path d={chart.pathFor('qr')} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
            <path d={chart.pathFor('onlineRevenue')} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
            {report.buckets.map((point, index) => <g key={point.bucket}><circle cx={chart.x(index)} cy={chart.y(point.revenue)} r="3.5" fill="#9a1b1b"><title>{`${point.bucket}: total ${money(point.revenue)}, cash ${money(point.cash)}, QR ${money(point.qr)}`}</title></circle>{(index % chart.labelEvery === 0 || index === report.buckets.length - 1) && <text x={chart.x(index)} y={chart.height - 12} textAnchor="middle" fontSize="10" fill="#78716c">{labelFor(point.bucket, report.granularity)}</text>}</g>)}
          </svg>
        </div>
      </div>}
    </>}
  </section>;
}
