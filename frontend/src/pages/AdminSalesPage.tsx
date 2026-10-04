import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { storeSalesApi, type StoreSale, type StoreSaleProduct } from '../api/storeSales';
import BrandLogo from '../components/BrandLogo';

const money = (value: string | number) => `NPR ${Number(value).toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StoreReceipt({ sale }: { sale: StoreSale }) {
  const itemLines = sale.items.reduce((sum, item) => sum + Math.max(1, Math.ceil(item.productName.length / 24)), 0);
  const customerLines = (sale.customerName ? 1 : 0) + (sale.customerPhone ? 1 : 0);
  const receiptHeightMm = Math.min(600, Math.max(90, 72 + sale.items.length * 8 + itemLines * 3 + customerLines * 4));
  return createPortal(<>
    <style>{`@page { size: 80mm ${receiptHeightMm}mm; margin: 3mm; }`}</style>
    <article className="print-bill" aria-label={`Receipt ${sale.saleNumber}`}>
    <header className="bill-header"><BrandLogo className="bill-logo" alt=""/><p className="bill-title">{sale.saleKind === 'HOUSE_USE' ? 'House Use Slip' : 'Store Sale Receipt'}</p></header>
    <section className="bill-meta"><div><span>Receipt</span><strong>{sale.saleNumber}</strong></div><div><span>Date</span><strong>{new Date(sale.createdAt).toLocaleString('en-NP')}</strong></div><div><span>Cashier</span><strong>{sale.cashierName}</strong></div></section>
    {sale.customerName && <section className="bill-customer"><h2>Customer</h2><p>{sale.customerName}</p>{sale.customerPhone && <p>{sale.customerPhone}</p>}</section>}
    <table className="bill-items"><colgroup><col className="bill-item-name-column"/><col className="bill-quantity-column"/><col className="bill-amount-column"/></colgroup><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>{sale.items.map(item => <tr key={item.id}><td>{item.productName}<small>@ {money(item.unitPrice)} / {item.unit}</small></td><td>{item.quantity}</td><td>{money(item.subtotal)}</td></tr>)}</tbody></table>
    <section className="bill-totals">{sale.saleKind === 'HOUSE_USE' ? <><div><span>Estimated stock value</span><span>{money(sale.subtotal)}</span></div><div className="bill-grand-total"><strong>Payment due</strong><strong>{money(0)}</strong></div></> : <><div><span>Subtotal</span><span>{money(sale.subtotal)}</span></div><div className="bill-grand-total"><strong>Total</strong><strong>{money(sale.total)}</strong></div>{sale.paymentType === 'CASH' && <><div><span>Cash received</span><span>{money(sale.tenderedAmount ?? 0)}</span></div><div><strong>Change</strong><strong>{money(sale.changeAmount ?? 0)}</strong></div></>}</>}</section>
    <section className="bill-status"><span>{sale.saleKind === 'HOUSE_USE' ? 'Transaction: House use · no payment' : `Payment: ${sale.paymentType === 'QR' ? 'QR paid' : 'Cash'}`}</span><span>Status: {sale.status}</span></section>
    <footer className="bill-footer">{sale.saleKind === 'HOUSE_USE' ? 'Internal stock use record.' : 'Thank you for shopping with us.'}</footer>
    </article>
  </>, document.body);
}

export default function AdminSalesPage() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<StoreSaleProduct[]>([]);
  const [sales, setSales] = useState<StoreSale[]>([]);
  const [selected, setSelected] = useState<StoreSale | null>(null);
  const [cart, setCart] = useState<Record<string, { product: StoreSaleProduct; quantity: number }>>({});
  const [search, setSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [paymentType, setPaymentType] = useState<'CASH' | 'QR'>('CASH');
  const [saleKind, setSaleKind] = useState<'SALE' | 'HOUSE_USE'>('SALE');
  const [tendered, setTendered] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProducts = async (term: string) => {
    if (!token) return;
    try {
      const results = await storeSalesApi.products(token, term);
      setProducts(results);
      setCart(current => {
        const next = { ...current };
        for (const product of results) {
          const line = next[product.id];
          if (line) next[product.id] = { ...line, product };
        }
        return next;
      });
    } catch (e) { setError((e as Error).message); }
  };
  const loadSales = async (term = historySearch) => { if (!token) return; try { const result = await storeSalesApi.list(token, term); setSales(result.data); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  useEffect(() => { void loadProducts(''); void loadSales(''); }, [token]);
  useEffect(() => { const timer = window.setTimeout(() => void loadProducts(search), 220); return () => window.clearTimeout(timer); }, [search, token]);
  const cartProducts = useMemo(() => Object.values(cart), [cart]);
  const totalCents = cartProducts.reduce((sum, item) => sum + Math.round(Number(item.product.price) * 100) * item.quantity, 0);
  const total = totalCents / 100;
  const cashValue = Number(tendered || 0);

  const changeQty = (product: StoreSaleProduct, delta: number) => setCart(current => {
    const next = { ...current };
    const quantity = (next[product.id]?.quantity ?? 0) + delta;
    if (quantity <= 0) delete next[product.id]; else next[product.id] = { product, quantity: Math.min(quantity, product.stockQuantity) };
    return next;
  });

  const completeSale = async () => {
    if (!token || !cartProducts.length) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const sale = await storeSalesApi.create(token, { items: cartProducts.map(({ product, quantity }) => ({ productId: product.id, quantity })), saleKind, ...(saleKind === 'SALE' ? { paymentType, ...(paymentType === 'CASH' ? { tenderedAmount: cashValue } : {}), customerName, customerPhone } : {}) });
      setSelected(sale); setSales(current => [sale, ...current]); setCart({}); setTendered(''); setCustomerName(''); setCustomerPhone('');
      setNotice(`Sale ${sale.saleNumber} saved. Stock has been updated.`); await loadProducts(search);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const changeStatus = async (sale: StoreSale, status: 'VOIDED' | 'REFUNDED') => {
    let restockRefundedItems: boolean | undefined;
    if (status === 'REFUNDED') {
      const decision = window.prompt('Were the refunded items physically returned and put back into stock? Type YES or NO. Cancel keeps the sale unchanged.');
      if (decision === null) return;
      const normalizedDecision = decision.trim().toLowerCase();
      if (normalizedDecision !== 'yes' && normalizedDecision !== 'no') { window.alert('Please type YES or NO. The sale was not changed.'); return; }
      restockRefundedItems = normalizedDecision === 'yes';
    }
    const reason = window.prompt(`Reason for ${status.toLowerCase()} this sale:`);
    if (!reason || !token) return;
    setBusy(true); setError('');
    try { const updated = await storeSalesApi.changeStatus(token, sale.id, status, reason, restockRefundedItems); setSales(current => current.map(item => item.id === updated.id ? updated : item)); if (selected?.id === updated.id) setSelected(updated); setNotice(`${sale.saleNumber} marked ${status.toLowerCase()}${status === 'REFUNDED' && !restockRefundedItems ? '; inventory was not changed.' : '; stock returned to inventory.'}`); await loadProducts(search); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  return <div className="min-h-screen bg-[#f7f4ec] px-4 py-5 pb-10 md:px-8 md:py-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 p-5 text-white shadow-sm md:p-7"><div><p className="text-sm font-semibold uppercase tracking-[.16em] text-white/80">In-store point of sale</p><h1 className="mt-1 text-2xl font-bold md:text-3xl">Store sales</h1><p className="mt-1 text-sm text-white/85">Ring up walk-in customers using your live product stock.</p></div><div className="rounded-xl bg-white/15 px-4 py-3 text-sm"><span className="text-white/75">Cashier</span><p className="font-semibold">{user?.username}</p></div></header>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}{notice && <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,.8fr)]">
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-stone-900">Products</h2><p className="text-sm text-stone-500">Search by product name and add to the bill.</p></div><label className="relative min-w-[220px] flex-1 sm:max-w-sm"><span className="sr-only">Search products</span><span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">⌕</span><input className="w-full rounded-xl border border-stone-300 bg-stone-50 py-2.5 pl-9 pr-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a product…" /></label></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{products.map(product => { const inCart = cart[product.id]?.quantity ?? 0; return <article key={product.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-stone-200 p-3 hover:border-brand-300 hover:shadow-sm"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-stone-100">{(product.image || product.images?.[0]) ? <img src={product.image || product.images[0]} alt="" className="h-full w-full object-cover"/> : <span className="text-2xl">🛍️</span>}</div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-stone-900">{product.name}</h3><p className="text-sm font-bold text-brand-700">{money(product.price)} <span className="font-normal text-stone-500">/ {product.unit}</span></p><p className={`text-xs ${product.stockQuantity <= 5 ? 'text-amber-700' : 'text-stone-500'}`}>Stock {product.stockQuantity}</p></div><button disabled={product.stockQuantity <= inCart} onClick={() => changeQty(product, 1)} aria-label={`Add ${product.name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-lg font-bold text-white hover:bg-brand-700 disabled:bg-stone-300">{inCart ? `+${inCart}` : '+'}</button></article>; })}</div>
          {products.length === 0 && <p className="py-12 text-center text-sm text-stone-500">No matching active products with available stock.</p>}
        </section>
        <section className="h-fit rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:sticky md:top-5 md:p-5">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-stone-900">Current bill</h2><p className="text-sm text-stone-500">{cartProducts.length} product types</p></div><button onClick={() => setCart({})} disabled={!cartProducts.length} className="text-sm font-semibold text-stone-500 hover:text-red-700 disabled:opacity-40">Clear</button></div>
          <div className="my-4 max-h-64 space-y-3 overflow-y-auto border-y border-dashed border-stone-200 py-3">{cartProducts.map(({ product, quantity }) => <div key={product.id} className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.name}</p><p className="text-xs text-stone-500">{money(product.price)} / {product.unit}</p></div><div className="flex items-center gap-2"><button className="h-8 w-8 rounded-lg border border-stone-300" onClick={() => changeQty(product, -1)} aria-label={`Remove one ${product.name}`}>−</button><span className="w-5 text-center text-sm font-semibold">{quantity}</span><button className="h-8 w-8 rounded-lg border border-stone-300" onClick={() => changeQty(product, 1)} disabled={quantity >= product.stockQuantity} aria-label={`Add one ${product.name}`}>+</button></div><strong className="w-20 text-right text-sm">{money(Math.round(Number(product.price) * 100) * quantity / 100)}</strong></div>)}</div>
          <div className="space-y-3"><fieldset><legend className="mb-2 text-sm font-semibold text-stone-700">Transaction type</legend><div className="grid grid-cols-2 gap-2">{([{value:'SALE',label:'🧾 Customer sale'},{value:'HOUSE_USE',label:'🏠 House use'}] as const).map(option => <button key={option.value} type="button" onClick={() => setSaleKind(option.value)} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${saleKind === option.value ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-500' : 'border-stone-300 text-stone-600'}`}>{option.label}</button>)}</div></fieldset>
          {saleKind === 'HOUSE_USE' ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">House use reduces inventory and records the product value separately. It is not counted as sales income.</p> : <><label className="block text-sm font-medium text-stone-700">Customer name <span className="font-normal text-stone-400">(optional)</span><input className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" value={customerName} onChange={e => setCustomerName(e.target.value)} maxLength={120} placeholder="Walk-in customer"/></label><label className="block text-sm font-medium text-stone-700">Phone <span className="font-normal text-stone-400">(optional)</span><input className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} maxLength={30} placeholder="98…"/></label>
          <fieldset><legend className="mb-2 text-sm font-semibold text-stone-700">Payment method</legend><div className="grid grid-cols-2 gap-2">{(['CASH','QR'] as const).map(method => <button key={method} type="button" onClick={() => setPaymentType(method)} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${paymentType === method ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-500' : 'border-stone-300 text-stone-600'}`}>{method === 'CASH' ? '💵 Cash' : '▦ QR paid'}</button>)}</div></fieldset>
          {paymentType === 'CASH' && <label className="block text-sm font-medium text-stone-700">Cash received<input className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" type="number" min={total} step="0.01" value={tendered} onChange={e => setTendered(e.target.value)} placeholder={total.toFixed(2)}/>{cashValue >= total && total > 0 && <span className="mt-1 block text-xs text-stone-500">Change due: {money(cashValue - total)}</span>}</label>}</>}
          <div className="flex justify-between border-t border-stone-200 pt-3 text-lg font-bold"><span>{saleKind === 'HOUSE_USE' ? 'Stock value' : 'Total'}</span><span>{money(saleKind === 'HOUSE_USE' ? total : total)}</span></div>
          <button disabled={busy || !cartProducts.length || (saleKind === 'SALE' && paymentType === 'CASH' && (cashValue < total || !tendered))} onClick={() => void completeSale()} className="w-full rounded-xl bg-brand-600 px-4 py-3 font-bold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300">{busy ? 'Saving…' : saleKind === 'HOUSE_USE' ? 'Record house use' : 'Complete sale'}</button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-bold">Recent store sales</h2><p className="text-sm text-stone-500">Separate from online delivery orders.</p></div><div className="flex gap-2"><input className="rounded-lg border border-stone-300 px-3 py-2 text-sm" value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Receipt, name, phone"/><button onClick={() => void loadSales(historySearch)} className="rounded-lg bg-stone-100 px-3 py-2 text-sm font-semibold hover:bg-stone-200">Search</button></div></div>
        {loading ? <p className="py-8 text-center text-stone-500">Loading sales…</p> : sales.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-stone-50 text-xs uppercase text-stone-500"><tr><th className="px-3 py-3">Receipt</th><th className="px-3 py-3">Time</th><th className="px-3 py-3">Cashier</th><th className="px-3 py-3">Payment</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Total / Value</th><th className="px-3 py-3">Actions</th></tr></thead><tbody className="divide-y divide-stone-100">{sales.map(sale => <tr key={sale.id}><td className="px-3 py-3 font-mono text-xs font-semibold">{sale.saleNumber}<div className="font-sans font-normal text-stone-500">{sale.items.length} lines{sale.saleKind === 'HOUSE_USE' && ' · house use'}</div></td><td className="px-3 py-3 text-stone-600">{new Date(sale.createdAt).toLocaleString()}</td><td className="px-3 py-3">{sale.cashierName}</td><td className="px-3 py-3">{sale.saleKind === 'HOUSE_USE' ? 'No payment' : sale.paymentType === 'CASH' ? 'Cash' : 'QR'}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${sale.saleKind === 'HOUSE_USE' ? 'bg-violet-100 text-violet-800' : sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{sale.saleKind === 'HOUSE_USE' ? 'HOUSE USE' : sale.status}</span>{sale.statusReason && <p className="mt-1 max-w-36 text-xs text-stone-500">{sale.statusReason}</p>}</td><td className="px-3 py-3 text-right font-bold">{money(sale.saleKind === 'HOUSE_USE' ? sale.subtotal : sale.total)}{sale.saleKind === 'HOUSE_USE' && <span className="block text-[10px] font-normal text-stone-500">not income</span>}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><button onClick={() => {setSelected(sale); window.setTimeout(() => window.print(), 0);}} className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold hover:bg-stone-50">Print</button>{user?.role === 'ADMIN' && sale.status === 'COMPLETED' && <><button disabled={busy} onClick={() => void changeStatus(sale, 'VOIDED')} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">Void</button>{sale.saleKind === 'SALE' && <button disabled={busy} onClick={() => void changeStatus(sale, 'REFUNDED')} className="rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50">Mark refunded</button>}</>}</div></td></tr>)}</tbody></table><p className="mt-3 text-xs text-stone-500">Refund status is a manual record; return QR or cash to the customer separately before marking it refunded.</p></div> : <p className="py-10 text-center text-sm text-stone-500">No in-store sales yet. Completed bills will appear here.</p>}
      </section>
      {selected && <StoreReceipt sale={selected}/>}
    </div>
  </div>;
}
