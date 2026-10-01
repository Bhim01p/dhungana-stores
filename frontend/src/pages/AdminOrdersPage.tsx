import { useEffect, useState, useCallback } from "react";
import { adminOrdersApi } from "../api/adminOrders";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import PrintableBill from "../components/PrintableBill";
import type { OrderStatus as OS, PaymentStatus as PS } from "../types";
import type { Order } from "../types";

type OrderStatus = OS;
type PaymentStatus = PS;

const LIMIT = 20;

const ORDER_STATUSES: OrderStatus[] = ["PENDING","CONFIRMED","PREPARING","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"];
const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING","CONFIRMED","NOT_REQUIRED","REFUNDED"];

function paymentColor(s: PaymentStatus) {
  if (s === "CONFIRMED")    return "bg-green-100 text-green-700";
  if (s === "PENDING")      return "bg-yellow-100 text-yellow-700";
  if (s === "NOT_REQUIRED") return "bg-blue-100 text-blue-700";
  if (s === "REFUNDED")     return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-700";
}

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "">("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!printOrder) return;
    const clearBill = () => setPrintOrder(null);
    window.addEventListener("afterprint", clearBill);
    const timer = window.setTimeout(() => window.print(), 100);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", clearBill);
    };
  }, [printOrder]);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const res = await adminOrdersApi.getAll(token, {
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        search: search || undefined,
        page,
        limit: LIMIT,
      });
      setOrders(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [token, page, statusFilter, paymentFilter, search]);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, orderStatus: OrderStatus) => {
    try { await adminOrdersApi.updateStatus(token!, orderId, orderStatus); await fetchOrders(); }
    catch (err: any) { setError(err.message); }
  };

  const handlePaymentStatusChange = async (orderId: string, paymentStatus: PaymentStatus) => {
    try { await adminOrdersApi.updatePaymentStatus(token!, orderId, paymentStatus); await fetchOrders(); }
    catch (err: any) { setError(err.message); }
  };

  if (loading) return <LoadingSpinner message="Loading orders..." />;

  return (
    <>
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-0.5">{orders.length} of {totalPages * LIMIT} orders</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Order Status</label>
          <select className="select w-44" value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as OrderStatus | ""); setPage(1); }}>
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status</label>
          <select className="select w-44" value={paymentFilter}
            onChange={e => { setPaymentFilter(e.target.value as PaymentStatus | ""); setPage(1); }}>
            <option value="">All Payments</option>
            {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <input className="input w-full" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Order #, customer name, phone..." />
        </div>
      </div>

      {orders.length > 0 && <div className="md:hidden space-y-3">
        {orders.map(order => <article key={order.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold text-gray-900">{order.orderNumber}</p>
              <p className="mt-1 font-semibold text-gray-900 break-words">{order.customerName}</p>
              <p className="text-xs text-gray-500">{order.phone}</p>
            </div>
            <p className="shrink-0 text-right font-bold text-brand-600">NPR {Number(order.total).toLocaleString("en-NP")}</p>
          </div>
          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
          <div className="grid grid-cols-1 gap-3">
            <label className="block text-xs font-semibold text-gray-600">Order status
              <select className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold" value={order.orderStatus} onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}>
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-gray-600">Payment status
              <select className={`mt-1 w-full rounded-lg border border-transparent px-3 py-2.5 text-sm font-semibold ${paymentColor(order.paymentStatus)}`} value={order.paymentStatus} onChange={e => handlePaymentStatusChange(order.id, e.target.value as PaymentStatus)}>
                {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
              </select>
            </label>
          </div>
          <button type="button" className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-brand-600" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
            {expandedOrder === order.id ? "Hide details" : "View order details"}
          </button>
          {expandedOrder === order.id && <div className="border-t border-gray-100 pt-3 space-y-3 text-sm">
            <div className="space-y-1 text-gray-600">
              <p><span className="font-semibold">Address:</span> {order.address}</p>
              {order.landmark && <p><span className="font-semibold">Landmark:</span> {order.landmark}</p>}
              {order.email && <p className="break-all"><span className="font-semibold">Email:</span> {order.email}</p>}
              {order.notes && <p><span className="font-semibold">Notes:</span> {order.notes}</p>}
            </div>
            <div className="space-y-2">
              {order.orderItems?.map((item: any) => <div key={item.id} className="flex justify-between gap-3 text-gray-600">
                <span className="min-w-0">{item.productName} × {item.quantity} {item.unit}</span>
                <span className="shrink-0">NPR {Number(item.subtotal).toLocaleString("en-NP")}</span>
              </div>)}
              <div className="flex justify-between border-t border-gray-100 pt-2 font-bold"><span>Total</span><span>NPR {Number(order.total).toLocaleString("en-NP")}</span></div>
            </div>
            {order.orderItems?.length > 0 && <button type="button" onClick={() => setPrintOrder(order as Order)} className="btn-secondary w-full py-2.5 text-sm">Print bill</button>}
          </div>}
        </article>)}
      </div>}

      {orders.length > 0 ? (
        <div className="hidden md:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-center">Order Status</th>
                  <th className="px-5 py-3 text-center">Payment Status</th>
                  <th className="px-5 py-3 text-right">Date</th>
                  <th className="px-5 py-3 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <>
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs font-bold">{order.orderNumber}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-xs text-gray-400">{order.phone}</div>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-brand-600">
                        NPR {Number(order.total).toLocaleString("en-NP")}
                      </td>

                      {/* Order status — inline dropdown */}
                      <td className="px-5 py-3 text-center">
                        <select
                          className="text-xs font-sans font-semibold py-1 px-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white cursor-pointer"
                          value={order.orderStatus}
                          onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        >
                          {ORDER_STATUSES.map(s => (
                            <option key={s} value={s}>{s.replace(/_/g," ")}</option>
                          ))}
                        </select>
                      </td>

                      {/* Payment status — inline dropdown */}
                      <td className="px-5 py-3 text-center">
                        <select
                          className={`text-xs font-sans font-semibold py-1 px-2 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer ${paymentColor(order.paymentStatus)}`}
                          value={order.paymentStatus}
                          onChange={e => handlePaymentStatusChange(order.id, e.target.value as PaymentStatus)}
                        >
                          {PAYMENT_STATUSES.map(s => (
                            <option key={s} value={s}>{s.replace(/_/g," ")}</option>
                          ))}
                        </select>
                      </td>

                      <td className="px-5 py-3 text-right text-gray-400 text-xs">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          className="text-xs text-brand-500 hover:text-brand-700 font-semibold"
                        >
                          {expandedOrder === order.id ? "Hide ▲" : "View ▼"}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expandedOrder === order.id && (
                      <tr key={`${order.id}-expanded`} className="bg-gray-50">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Delivery info */}
                            <div className="space-y-1 text-sm">
                              <p className="font-semibold text-gray-700 mb-2">Delivery Info</p>
                              <p><span className="text-gray-500">Address:</span> {order.address}</p>
                              {order.landmark && <p><span className="text-gray-500">Landmark:</span> {order.landmark}</p>}
                              {order.email && <p><span className="text-gray-500">Email:</span> {order.email}</p>}
                              {order.notes && <p><span className="text-gray-500">Notes:</span> {order.notes}</p>}
                            </div>
                            {/* Order items */}
                            {order.orderItems && order.orderItems.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-semibold text-gray-700 text-sm">Items</p>
                                  <button
                                    type="button"
                                    onClick={() => setPrintOrder(order as Order)}
                                    className="btn-secondary px-3 py-1.5 text-xs"
                                    title="To remove the browser URL from the printout, turn off Headers and footers in print settings."
                                  >
                                    Print bill
                                  </button>
                                </div>
                                <div className="space-y-1">
                                  {order.orderItems.map((item: any) => (
                                    <div key={item.id} className="flex justify-between text-sm text-gray-600">
                                      <span>{item.productName} × {item.quantity} {item.unit}</span>
                                      <span className="font-medium">NPR {Number(item.subtotal).toLocaleString("en-NP")}</span>
                                    </div>
                                  ))}
                                  <div className="border-t border-gray-200 pt-1 flex justify-between text-sm font-bold text-gray-900 mt-1">
                                    <span>Total</span>
                                    <span className="text-brand-600">NPR {Number(order.total).toLocaleString("en-NP")}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between text-sm text-gray-500">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1,page-1))} disabled={page<=1} className="btn-secondary px-3 py-1 disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(Math.min(totalPages,page+1))} disabled={page>=totalPages} className="btn-secondary px-3 py-1 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <span className="text-4xl">📦</span>
          <p className="text-gray-500 mt-3">No orders found.</p>
        </div>
      )}
    </div>
    {printOrder && <PrintableBill order={printOrder} />}
    </>
  );
}
