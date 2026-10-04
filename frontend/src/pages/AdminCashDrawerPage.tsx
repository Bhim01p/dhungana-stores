import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storeSalesApi, type CashDrawerSummary } from '../api/storeSales';

const amount = (value: number | string) => `NPR ${Number(value).toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
function todayInNepal() {
  const now = new Date(Date.now() + 345 * 60_000);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

export default function AdminCashDrawerPage() {
  const { token, user } = useAuth();
  const [date, setDate] = useState(todayInNepal);
  const [summary, setSummary] = useState<CashDrawerSummary | null>(null);
  const [openingCash, setOpeningCash] = useState('');
  const [countedCash, setCountedCash] = useState('');
  const [paidIn, setPaidIn] = useState('0');
  const [paidOut, setPaidOut] = useState('0');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async (selectedDate = date) => {
    if (!token) return;
    setLoading(true); setError('');
    try { setSummary(await storeSalesApi.cashDrawer(token, selectedDate)); }
    catch (e) { setError((e as Error).message); setSummary(null); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(date); }, [token, date]);

  const existing = summary?.closing;
  const opening = Number(openingCash || 0), added = Number(paidIn || 0), removed = Number(paidOut || 0);
  const expectedCash = useMemo(() => summary ? opening + summary.cashSales - summary.cashRefunds - summary.cashVoids + added - removed : 0, [summary, opening, added, removed]);
  const variance = Number(countedCash || 0) - expectedCash;

  const closeDrawer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !summary || existing) return;
    if (!window.confirm(`Close the drawer for ${date}? This daily reconciliation cannot be edited after saving.`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const closing = await storeSalesApi.closeCashDrawer(token, { businessDate: date, openingCash: opening, countedCash: Number(countedCash), paidIn: added, paidOut: removed, notes });
      setSummary({ ...summary, closing }); setNotice('Cash drawer reconciliation was saved.');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const rows = existing ? [
    ['Opening float', existing.openingCash], ['Cash sales', existing.cashSales], ['Cash refunds', `− ${existing.cashRefunds}`], ['Voided cash sales', `− ${existing.cashVoids}`], ['Cash added', existing.paidIn], ['Cash removed', `− ${existing.paidOut}`], ['Expected drawer cash', existing.expectedCash], ['Cash counted', existing.countedCash], ['Difference', existing.variance], ['QR sales (tracked separately)', existing.qrSales],
  ] : summary ? [
    ['Opening float', amount(opening)], ['Cash sales', amount(summary.cashSales)], ['Cash refunds', `− ${amount(summary.cashRefunds)}`], ['Voided cash sales', `− ${amount(summary.cashVoids)}`], ['Cash added', amount(added)], ['Cash removed', `− ${amount(removed)}`], ['Expected drawer cash', amount(expectedCash)], ['QR sales (tracked separately)', amount(summary.qrSales)],
  ] : [];

  return <div className="min-h-screen bg-[#f7f4ec] px-4 py-6 md:px-8">
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 p-6 text-white"><p className="text-sm font-semibold uppercase tracking-widest text-white/80">End of day</p><h1 className="mt-1 text-2xl font-bold">Cash drawer closing</h1><p className="mt-2 text-sm text-white/85">Compare expected cash from recorded sales with the money counted in the drawer. QR sales are tracked separately.</p></header>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}{notice && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4"><label className="text-sm font-semibold text-stone-700">Business date<input type="date" value={date} max={todayInNepal()} onChange={e => setDate(e.target.value)} className="mt-1 block rounded-lg border border-stone-300 px-3 py-2" /></label><div className="text-right text-sm text-stone-500">Cashier: <strong className="text-stone-800">{user?.username}</strong></div></div>
      </section>
      {loading ? <div className="rounded-2xl bg-white p-10 text-center text-stone-500">Loading the day’s sales…</div> : summary && <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900">Sales reconciliation</h2><p className="mb-4 text-sm text-stone-500">House use is excluded. Voids and cash refunds reduce expected drawer cash.</p>
          <dl className="divide-y divide-stone-100">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-3 py-3 text-sm"><dt className={label.includes('Expected') ? 'font-bold text-stone-900' : 'text-stone-600'}>{label}</dt><dd className={label.includes('Expected') ? 'font-bold text-brand-700' : 'font-semibold text-stone-800'}>{typeof value === 'string' && value.startsWith('− ') ? `− ${amount(value.slice(2))}` : amount(value)}</dd></div>)}
          {!existing && <div className="flex justify-between gap-3 border-t-2 border-stone-200 py-3 text-sm"><dt className="font-bold text-stone-900">Counted cash</dt><dd className="font-bold text-stone-800">{countedCash ? amount(countedCash) : '—'}</dd></div>}
          {!existing && countedCash && <div className="flex justify-between gap-3 py-2 text-sm"><dt className="font-semibold">Difference</dt><dd className={`font-bold ${variance === 0 ? 'text-emerald-700' : variance > 0 ? 'text-blue-700' : 'text-red-700'}`}>{variance >= 0 ? '+' : '−'} {amount(Math.abs(variance))}</dd></div>}
          {existing && <div className="flex justify-between gap-3 py-3 text-sm"><dt className="font-bold">Closed by</dt><dd className="font-semibold">{existing.closedBy?.username ?? 'Former staff account'}</dd></div>}
          </dl>
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          {existing ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-bold text-emerald-900">This day is closed</p><p className="mt-1 text-sm text-emerald-800">Saved at {new Date(existing.createdAt).toLocaleString('en-NP')}.</p>{existing.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">{existing.notes}</p>}</div> : <form onSubmit={closeDrawer} className="space-y-4">
            <h2 className="text-lg font-bold text-stone-900">Count and close</h2>
            <label className="block text-sm font-medium text-stone-700">Opening cash (float)<input required min="0" step="0.01" type="number" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5" value={openingCash} onChange={e => setOpeningCash(e.target.value)} placeholder="Cash present when the drawer opened" /></label>
            <label className="block text-sm font-medium text-stone-700">Cash counted<input required min="0" step="0.01" type="number" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5" value={countedCash} onChange={e => setCountedCash(e.target.value)} placeholder="Count all notes and coins" /></label>
            <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium text-stone-700">Cash added<input min="0" step="0.01" type="number" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5" value={paidIn} onChange={e => setPaidIn(e.target.value)} /></label><label className="block text-sm font-medium text-stone-700">Cash removed<input min="0" step="0.01" type="number" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5" value={paidOut} onChange={e => setPaidOut(e.target.value)} /></label></div>
            <label className="block text-sm font-medium text-stone-700">Notes<textarea maxLength={1000} rows={3} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Explain any difference or cash movements" /></label>
            <button disabled={busy || !countedCash || Number(countedCash) < 0} className="min-h-12 w-full rounded-xl bg-brand-600 px-4 font-bold text-white hover:bg-brand-700 disabled:opacity-50">{busy ? 'Saving…' : 'Save daily close'}</button>
            <p className="text-xs leading-relaxed text-stone-500">Closing is final for this date. Make sure cash and recorded sales are correct before saving.</p>
          </form>}
        </section>
      </div>}
    </div>
  </div>;
}
