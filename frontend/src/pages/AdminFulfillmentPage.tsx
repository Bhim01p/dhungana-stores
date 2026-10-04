import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fulfillmentApi } from '../api/fulfillment';
import type { DeliveryArea, DeliverySlot } from '../types';

const field = 'mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm';

export default function AdminFulfillmentPage() {
  const { token } = useAuth();
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [name, setName] = useState('');
  const [charge, setCharge] = useState('50');
  const [threshold, setThreshold] = useState('500');
  const [slotLabel, setSlotLabel] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    if (!token) return;
    try { const result = await fulfillmentApi.adminOptions(token); setAreas(result.areas); setSlots(result.slots); }
    catch (e) { setError((e as Error).message); }
  };
  useEffect(() => { void load(); }, [token]);

  const addArea = async (event: React.FormEvent) => {
    event.preventDefault(); if (!token) return;
    setBusy(true); setError(''); setNotice('');
    try { await fulfillmentApi.createArea(token, { name, deliveryCharge: Number(charge), freeDeliveryThreshold: Number(threshold) }); setName(''); setNotice('Delivery area added.'); await load(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const saveArea = async (area: DeliveryArea, form: HTMLFormElement) => {
    if (!token) return;
    const values = new FormData(form);
    setBusy(true); setError(''); setNotice('');
    try { await fulfillmentApi.updateArea(token, area.id, { name: String(values.get('name')), deliveryCharge: String(values.get('charge')), freeDeliveryThreshold: String(values.get('threshold')) }); setNotice('Delivery area saved.'); await load(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const toggleArea = async (area: DeliveryArea) => {
    if (!token) return;
    setBusy(true); setError('');
    try { await fulfillmentApi.updateArea(token, area.id, { active: !area.active }); await load(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const addSlot = async (event: React.FormEvent) => {
    event.preventDefault(); if (!token) return;
    setBusy(true); setError(''); setNotice('');
    try { await fulfillmentApi.createSlot(token, { label: slotLabel || `${startTime}–${endTime}`, startTime, endTime, weekdays: [] }); setSlotLabel(''); setNotice('Time slot added.'); await load(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const toggleSlot = async (slot: DeliverySlot) => {
    if (!token) return;
    setBusy(true); setError('');
    try { await fulfillmentApi.updateSlot(token, slot.id, { active: !slot.active }); await load(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return <div className="min-h-screen bg-[#f7f4ec] px-4 py-6 md:px-8">
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 p-6 text-white"><p className="text-sm font-semibold uppercase tracking-widest text-white/80">Store settings</p><h1 className="mt-1 text-2xl font-bold">Delivery &amp; pickup</h1><p className="mt-2 text-sm text-white/85">Customers can choose delivery to an area or collect from the physical store, then choose a date and time.</p></header>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}{notice && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4"><h2 className="text-lg font-bold text-stone-900">Delivery areas</h2><p className="text-sm text-stone-500">Set a delivery fee and free-delivery threshold for each area.</p></div>
        <form onSubmit={addArea} className="mb-5 grid gap-3 rounded-xl bg-stone-50 p-4 sm:grid-cols-4 sm:items-end">
          <label className="text-sm font-medium">Area name<input required maxLength={100} className={field} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nearby neighborhoods" /></label>
          <label className="text-sm font-medium">Delivery fee (NPR)<input required type="number" min="0" step="0.01" className={field} value={charge} onChange={e => setCharge(e.target.value)} /></label>
          <label className="text-sm font-medium">Free over (NPR)<input required type="number" min="0" step="0.01" className={field} value={threshold} onChange={e => setThreshold(e.target.value)} /></label>
          <button disabled={busy} className="min-h-10 rounded-lg bg-brand-600 px-4 text-sm font-bold text-white disabled:opacity-50">Add area</button>
        </form>
        <div className="space-y-3">{areas.map(area => <form key={area.id} onSubmit={e => { e.preventDefault(); void saveArea(area, e.currentTarget); }} className="grid gap-3 rounded-xl border border-stone-200 p-3 sm:grid-cols-[1.3fr_1fr_1fr_auto_auto] sm:items-end">
          <label className="text-xs font-semibold text-stone-600">Area<input name="name" defaultValue={area.name} className={field} /></label>
          <label className="text-xs font-semibold text-stone-600">Fee<input name="charge" type="number" min="0" step="0.01" defaultValue={area.deliveryCharge} className={field} /></label>
          <label className="text-xs font-semibold text-stone-600">Free threshold<input name="threshold" type="number" min="0" step="0.01" defaultValue={area.freeDeliveryThreshold} className={field} /></label>
          <button disabled={busy} className="min-h-10 rounded-lg border border-brand-300 px-3 text-sm font-semibold text-brand-700 disabled:opacity-50">Save</button>
          <button type="button" disabled={busy} onClick={() => void toggleArea(area)} className={`min-h-10 rounded-lg px-3 text-sm font-semibold disabled:opacity-50 ${area.active ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>{area.active ? 'Active · turn off' : 'Inactive · turn on'}</button>
        </form>)}</div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4"><h2 className="text-lg font-bold text-stone-900">Pickup &amp; delivery time slots</h2><p className="text-sm text-stone-500">Pickup is enabled at the store. Active time slots repeat every day.</p></div>
        <form onSubmit={addSlot} className="mb-5 grid gap-3 rounded-xl bg-stone-50 p-4 sm:grid-cols-4 sm:items-end">
          <label className="text-sm font-medium">Slot label<input maxLength={80} className={field} value={slotLabel} onChange={e => setSlotLabel(e.target.value)} placeholder="Morning" /></label>
          <label className="text-sm font-medium">Starts<input required type="time" className={field} value={startTime} onChange={e => setStartTime(e.target.value)} /></label>
          <label className="text-sm font-medium">Ends<input required type="time" className={field} value={endTime} onChange={e => setEndTime(e.target.value)} /></label>
          <button disabled={busy} className="min-h-10 rounded-lg bg-brand-600 px-4 text-sm font-bold text-white disabled:opacity-50">Add time slot</button>
        </form>
        <div className="grid gap-3 sm:grid-cols-2">{slots.map(slot => <div key={slot.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-4"><div><p className="font-semibold text-stone-800">{slot.label}</p><p className="text-sm text-stone-500">{slot.startTime}–{slot.endTime} · every day</p></div><button type="button" disabled={busy} onClick={() => void toggleSlot(slot)} className={`rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 ${slot.active ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>{slot.active ? 'Active' : 'Inactive'}</button></div>)}</div>
      </section>
    </div>
  </div>;
}
