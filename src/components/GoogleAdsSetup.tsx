"use client";
import { useCallback, useEffect, useState } from "react";

type Status = {
  configured: boolean; connected: boolean; missingEnv: string[];
  accounts: Array<{ customerId: string; customerName: string }>;
  selectedAccountId: string | null; tokenExpired: boolean;
  mappingHealthy: boolean; connectionError: string | null;
  implementationStatus: string;
};
const field = "w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm";
const button = "rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white";
const secondary = "rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold";

export function GoogleAdsSetup({ clientId }: { clientId: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [loginCustomerId, setLoginCustomerId] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const response = await fetch(`/api/integrations/google/status?clientId=${encodeURIComponent(clientId)}`, { cache: "no-store" });
    const payload = await response.json() as Status & { error?: string };
    if (!response.ok) return setMessage(payload.error ?? "Could not load Google Ads status.");
    setStatus(payload); setCustomerId(payload.selectedAccountId ?? payload.accounts[0]?.customerId ?? "");
  }, [clientId]);
  useEffect(() => { const task = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(task); }, [load]);
  async function save() {
    const account = status?.accounts.find((item) => item.customerId === customerId);
    const response = await fetch(`/api/integrations/google/accounts?clientId=${encodeURIComponent(clientId)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, customerName: account?.customerName, loginCustomerId }),
    });
    const payload = await response.json() as { error?: string };
    setMessage(response.ok ? "Google Ads customer saved." : payload.error ?? "Save failed.");
    if (response.ok) await load();
  }
  async function discover() {
    const response = await fetch(`/api/integrations/google/events-preview?clientId=${encodeURIComponent(clientId)}`, { cache: "no-store" });
    const payload = await response.json() as { events?: unknown[]; error?: string };
    setMessage(response.ok ? `Detected ${payload.events?.length ?? 0} Google Ads conversion actions. Select them in the shared mapping panel above.` : payload.error ?? "Discovery failed.");
  }
  return (
    <section id="google-ads-connection" className="rounded-[18px] border border-[var(--line)] bg-white/58 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div><div className="text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--muted)]">Paid Search</div><h2 className="mt-1 text-lg font-semibold">Google Ads</h2><p className="mt-1 text-sm text-[var(--muted)]">Implemented, awaiting live validation.</p></div>
        <span className="rounded-full border px-2 py-1 text-xs font-semibold">{status?.connected ? status.tokenExpired ? "Token expired" : "Connected" : "Awaiting connection"}</span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <select className={field} value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">Choose customer</option>{(status?.accounts ?? []).map((item) => <option key={item.customerId} value={item.customerId}>{item.customerName} · {item.customerId}</option>)}</select>
        <input className={field} value={loginCustomerId} onChange={(event) => setLoginCustomerId(event.target.value)} placeholder="Optional manager login customer ID" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a className={button} href={`/api/integrations/google/connect?clientId=${encodeURIComponent(clientId)}`}>{status?.connected ? "Reconnect Google Ads" : "Connect Google Ads"}</a>
        <button className={secondary} type="button" disabled={!customerId} onClick={() => void save()}>Save customer</button>
        <button className={secondary} type="button" onClick={() => void discover()}>Discover conversions</button>
      </div>
      {status?.missingEnv.length ? <div className="mt-3 text-sm text-amber-800">External setup deferred: {status.missingEnv.join(", ")}</div> : null}
      <div className="mt-2 text-xs text-[var(--muted)]">Mapping: {status?.mappingHealthy ? "healthy" : "missing"}{status?.connectionError ? ` · ${status.connectionError}` : ""}</div>
      {message ? <div className="mt-3 rounded-xl border px-3 py-2 text-sm">{message}</div> : null}
    </section>
  );
}
