import { useCallback, useEffect, useState } from "react";
import { supportApi, type SupportMessage, type SupportStatus } from "../api/support";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const statusLabel: Record<SupportStatus, string> = { NEW: "New", IN_PROGRESS: "In progress", RESOLVED: "Resolved" };
const typeLabel = { HELP: "Help request", COMPLAINT: "Complaint", REVIEW: "Store review", OTHER: "Other" };

export default function AdminMessagesPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [statusFilter, setStatusFilter] = useState<SupportStatus | "">("NEW");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try { const result = await supportApi.getAll(token, page, statusFilter || undefined); setMessages(result.data); setTotalPages(result.meta.totalPages); setTotal(result.meta.total); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load messages."); }
    finally { setLoading(false); }
  }, [token, page, statusFilter]);

  useEffect(() => { void refresh(); }, [refresh]);

  const changeStatus = async (message: SupportMessage, status: SupportStatus) => {
    if (!token) return;
    try { await supportApi.updateStatus(token, message.id, status); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update this message."); }
  };

  const sendReply = async (message: SupportMessage) => {
    if (!token) return;
    const body = drafts[message.id]?.trim();
    if (!body) return;
    setSendingReply(message.id); setError(null); setNotice(null);
    try {
      const result = await supportApi.reply(token, message.id, body);
      setDrafts(current => ({ ...current, [message.id]: "" }));
      setNotice(result.emailSent ? `Reply sent to ${message.email}.` : "Reply saved to the customer’s message history, but the email could not be sent. Check SMTP settings and use Resend email below.");
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not send the reply."); }
    finally { setSendingReply(null); }
  };

  const resendReply = async (message: SupportMessage, replyId: string) => {
    if (!token) return;
    setSendingReply(replyId); setError(null); setNotice(null);
    try {
      await supportApi.resendReply(token, message.id, replyId);
      setNotice(`Reply email sent to ${message.email}.`);
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not resend the reply email."); }
    finally { setSendingReply(null); }
  };

  if (loading && messages.length === 0) return <LoadingSpinner message="Loading messages…" />;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Customer care</p><h1 className="text-2xl font-bold text-gray-900">Help &amp; feedback</h1><p className="mt-1 text-gray-500">Questions, complaints, and store reviews sent by customers.</p></div>
        <label className="text-sm font-semibold text-gray-600">Filter<select className="select mt-1 block min-w-40" value={statusFilter} onChange={event => { setStatusFilter(event.target.value as SupportStatus | ""); setPage(1); }}><option value="NEW">New</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option><option value="">All messages</option></select></label>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <div className="flex items-center justify-between text-sm text-gray-500"><span>{total} {total === 1 ? "message" : "messages"}</span><button onClick={() => void refresh()} className="btn-secondary px-3 py-2">Refresh</button></div>
      {messages.length === 0 ? <div className="card p-12 text-center"><div className="text-4xl">📭</div><h2 className="mt-3 font-semibold text-gray-800">No messages here</h2><p className="mt-1 text-sm text-gray-500">New customer messages will show up in this inbox.</p></div> :
        <div className="space-y-4">{messages.map(message => <article key={message.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-stone-100 bg-stone-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800">{typeLabel[message.type]}</span>{message.rating && <span className="text-sm font-semibold text-amber-500">{"★".repeat(message.rating)}<span className="text-stone-400">{"★".repeat(5 - message.rating)}</span></span>}</div><h2 className="mt-2 truncate text-lg font-bold text-stone-900">{message.subject}</h2><p className="mt-0.5 text-sm text-stone-500">{message.name} · {new Date(message.createdAt).toLocaleString()}</p></div>
            <select aria-label={`Update status for ${message.subject}`} className="select min-w-36 sm:w-auto" value={message.status} onChange={event => void changeStatus(message, event.target.value as SupportStatus)}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="space-y-4 p-4 sm:p-5"><div><p className="whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">{message.message}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-stone-100 pt-3 text-sm">{message.email && <a className="font-medium text-brand-700 hover:underline" href={`mailto:${message.email}`}>✉ {message.email}</a>}{message.phone && <a className="font-medium text-brand-700 hover:underline" href={`tel:${message.phone}`}>☎ {message.phone}</a>}{!message.email && !message.phone && <span className="text-stone-400">No reply contact provided</span>}</div></div>
            {!!message.replies?.length && <div className="space-y-3 border-t border-stone-100 pt-4"><h3 className="text-sm font-bold text-stone-800">Reply history</h3>{message.replies.map(reply => <div key={reply.id} className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-emerald-900">{reply.responderName} · {new Date(reply.createdAt).toLocaleString()}</p><span className={`text-xs font-semibold ${reply.emailSentAt ? "text-emerald-800" : "text-amber-800"}`}>{reply.emailSentAt ? "Email sent" : "Email not sent"}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-800">{reply.body}</p>{!reply.emailSentAt && message.email && <button type="button" disabled={!!sendingReply} onClick={() => void resendReply(message, reply.id)} className="mt-3 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50">{sendingReply === reply.id ? "Sending…" : "Resend email"}</button>}</div>)}</div>}
            {message.email ? <div className="border-t border-stone-100 pt-4"><label className="block text-sm font-semibold text-stone-800">Reply to customer<textarea value={drafts[message.id] ?? ""} onChange={event => setDrafts(current => ({ ...current, [message.id]: event.target.value }))} rows={3} maxLength={5000} className="input mt-2 resize-y" placeholder="Write a reply. It will be saved to the customer’s history and emailed to them." /></label><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-stone-500">Sent to {message.email}</p><button type="button" onClick={() => void sendReply(message)} disabled={!drafts[message.id]?.trim() || !!sendingReply} className="btn-primary min-h-10 px-4 py-2 disabled:opacity-50">{sendingReply === message.id ? "Sending…" : "Send reply"}</button></div></div> : <p className="border-t border-stone-100 pt-4 text-sm text-amber-800">This message has no email address. Add an email reply contact before replying from here.</p>}
          </div>
        </article>)}</div>}
      {totalPages > 1 && <div className="flex items-center justify-between border-t border-stone-200 pt-4 text-sm text-gray-500"><span>Page {page} of {totalPages}</span><div className="flex gap-2"><button onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page <= 1} className="btn-secondary px-3 py-2 disabled:opacity-40">Previous</button><button onClick={() => setPage(value => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="btn-secondary px-3 py-2 disabled:opacity-40">Next</button></div></div>}
    </div>
  );
}
