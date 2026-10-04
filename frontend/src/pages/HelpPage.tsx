import { FormEvent, useEffect, useState } from "react";
import { supportApi, type SupportMessage, type SupportType } from "../api/support";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";
import { useLanguage } from "../i18n/LanguageContext";

export default function HelpPage() {
  const { t, language } = useLanguage();
  const { customer, customerToken } = useCustomerAuth();
  const [type, setType] = useState<SupportType>("HELP");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [history, setHistory] = useState<SupportMessage[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    if (!customerToken) { setHistory([]); return; }
    let cancelled = false;
    setHistoryLoading(true); setHistoryError(null);
    supportApi.getMine(customerToken)
      .then(messages => { if (!cancelled) setHistory(messages); })
      .catch(err => { if (!cancelled) setHistoryError(err instanceof Error ? err.message : "Could not load your messages."); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [customerToken, historyVersion]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (type !== "REVIEW" && !String(form.get("email") ?? "").trim() && !String(form.get("phone") ?? "").trim()) {
      setError(t("Add an email or phone number so the store team can reply."));
      return;
    }
    setSaving(true); setError(null); setSuccess(null);
    try {
      const result = await supportApi.submit({
        type, name: String(form.get("name") ?? ""), email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""), subject: String(form.get("subject") ?? ""),
        message: String(form.get("message") ?? ""), ...(type === "REVIEW" ? { rating } : {}),
      }, customerToken);
      setSuccess(t(result.message)); formElement.reset(); setType("HELP"); setRating(5);
      if (customerToken) setHistoryVersion(value => value + 1);
    } catch (err) { setError(t(err instanceof Error ? err.message : "Could not send your message.")); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-[65vh] bg-gradient-to-b from-brand-50/70 to-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="pt-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{t("We’re here to help")}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">{t("Help & feedback")}</h1>
          <p className="mt-3 text-stone-600">{t("Ask a question, share a complaint, or leave a store review. Your message goes directly to our store team.")}</p>
          <div className="mt-6 space-y-3">
            {[["💬", "Talk to the store team", "We’ll review your message in our admin desk."], ["🔒", "Your details stay private", "We only use your contact details to follow up."]].map(([icon, title, detail]) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm"><span className="text-xl" aria-hidden="true">{icon}</span><div><p className="font-semibold text-stone-800">{t(title)}</p><p className="mt-0.5 text-sm text-stone-500">{t(detail)}</p></div></div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xl shadow-stone-900/5 sm:p-7">
          <h2 className="text-xl font-bold text-stone-900">{t("Send us a message")}</h2><p className="mt-1 text-sm text-stone-500">{t("Fields marked * are required.")}</p>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-stone-700">{t("What do you need? *")}<select required value={type} onChange={event => setType(event.target.value as SupportType)} className="input mt-1.5"><option value="HELP">{t("Help / question")}</option><option value="COMPLAINT">{t("Complaint")}</option><option value="REVIEW">{t("Store review")}</option><option value="OTHER">{t("Something else")}</option></select></label>
            {type === "REVIEW" && <fieldset><legend className="text-sm font-semibold text-stone-700">{t("Your rating *")}</legend><div className="mt-1 flex gap-1" role="radiogroup" aria-label={t("Store rating")}>{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} ${t(value === 1 ? "star" : "stars")}`} onClick={() => setRating(value)} className={`rounded-lg p-1 text-2xl transition hover:scale-110 ${rating >= value ? "text-amber-400" : "text-stone-300"}`}>★</button>)}</div></fieldset>}
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-stone-700">{t("Your name *")}<input key={customer?.id ?? "guest-name"} name="name" required maxLength={100} defaultValue={customer?.name ?? ""} readOnly={!!customer} className="input mt-1.5 read-only:bg-stone-50" autoComplete="name" /></label><label className="block text-sm font-semibold text-stone-700">{t(customer ? "Email (account email)" : "Email (optional)")}<input key={customer?.id ?? "guest-email"} name="email" type="email" maxLength={254} defaultValue={customer?.email ?? ""} readOnly={!!customer} className="input mt-1.5 read-only:bg-stone-50" autoComplete="email" placeholder={t("For a reply")} /></label></div>
            <label className="block text-sm font-semibold text-stone-700">{t("Phone (optional)")}<input key={customer?.id ?? "guest-phone"} name="phone" type="tel" maxLength={30} defaultValue={customer?.phone ?? ""} readOnly={!!customer} className="input mt-1.5 read-only:bg-stone-50" autoComplete="tel" /></label>
            {type !== "REVIEW" && <p className="-mt-3 text-xs text-stone-500">{t("Please provide at least one contact method so we can respond.")}</p>}
            <label className="block text-sm font-semibold text-stone-700">{t("Subject *")}<input name="subject" required maxLength={160} className="input mt-1.5" placeholder={t("What is this about?")} /></label>
            <label className="block text-sm font-semibold text-stone-700">{t("Message *")}<textarea name="message" required minLength={10} maxLength={5000} rows={5} className="input mt-1.5 resize-y" placeholder={t("Tell us a little more (at least 10 characters)")} /></label>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{t(error)}</p>}{success && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{success}</p>}
            <button type="submit" disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-60">{saving ? t("Sending…") : t("Send to the store team")}<span aria-hidden="true">→</span></button>
          </div>
        </form>
        {customerToken && <section className="lg:col-span-2" aria-labelledby="support-history-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 id="support-history-title" className="text-xl font-extrabold text-stone-900">{t("Your messages")}</h2><p className="mt-1 text-sm text-stone-600">{t("View your questions and the store team’s replies here.")}</p></div><button type="button" onClick={() => setHistoryVersion(value => value + 1)} className="btn-secondary px-3 py-2" disabled={historyLoading}>{t("Refresh")}</button></div>
          {historyError && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{t(historyError)}</p>}
          {historyLoading && history.length === 0 ? <p className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-500">{t("Loading your messages…")}</p> : history.length === 0 ? <p className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-500">{t("You haven’t sent a help request or complaint yet.")}</p> : <div className="space-y-4">{history.map(item => <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-stone-900">{item.subject}</h3><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800">{t(item.status.replace("_", " "))}</span></div><p className="mt-1 text-xs text-stone-500">{t(item.type)} · {new Date(item.createdAt).toLocaleString(language === "ne" ? "ne-NP" : undefined)}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">{item.message}</p>{item.replies?.map(reply => <div key={reply.id} className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">{t("Reply from the store")} · {new Date(reply.createdAt).toLocaleString(language === "ne" ? "ne-NP" : undefined)}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-800">{reply.body}</p><p className="mt-2 text-xs text-stone-500">{t(reply.emailSentAt ? "Reply copy sent" : "Reply saved; email pending")}</p></div>)}</article>)}</div>}
        </section>}
      </div>
    </div>
  );
}
