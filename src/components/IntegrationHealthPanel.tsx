"use client";
import { useEffect, useState } from "react";
type Record = {
  clientId: string; clientName: string; sourceType: string; status: string; selectedAccountId: string | null;
  mappingStatus: string; tokenExpiresAt: string | null; lastSuccessfulSyncAt: string | null; lastAttemptAt: string | null;
  lastError: string | null; dataFreshness: string; nextAction: string;
};
type Payload = { checkedAt: string; summary: { total: number; healthy: number; needsAction: number; failed: number; expired: number; stale: number }; records: Record[]; storage: { durable: boolean; message: string } };
export function IntegrationHealthPanel() {
  const [payload, setPayload] = useState<Payload | null>(null), [error, setError] = useState("");
  useEffect(() => { const task = window.setTimeout(async () => { try { const response = await fetch("/api/health/integrations", { cache: "no-store" }), data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Health request failed."); setPayload(data); } catch (reason) { setError(reason instanceof Error ? reason.message : "Health request failed."); } }, 0); return () => window.clearTimeout(task); }, []);
  return <section className="rounded-[24px] border border-[var(--line)] bg-white/60 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-semibold text-[var(--ink)]">Integration Operations</h2><p className="mt-1 text-sm text-[var(--muted)]">Connection, token, mapping, sync, freshness, and failure state for every client and paid source.</p></div><span className="rounded-full border px-3 py-1 text-xs font-semibold">{payload ? `${payload.summary.needsAction} need action` : "Loading"}</span></div>
    {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
    {payload ? <><div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{Object.entries(payload.summary).map(([label, value]) => <div key={label} className="rounded-xl border bg-white/60 p-3"><div className="text-xs uppercase text-[var(--muted)]">{label.replaceAll(/([A-Z])/g, " $1")}</div><div className="mt-1 text-xl font-semibold">{value}</div></div>)}</div>
    <div className={`mt-3 rounded-xl border p-3 text-sm ${payload.storage.durable ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>{payload.storage.message}</div>
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1050px] text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-[.1em] text-[var(--muted)]"><th className="p-2">Client</th><th className="p-2">Source</th><th className="p-2">Status</th><th className="p-2">Mapping</th><th className="p-2">Freshness</th><th className="p-2">Last sync</th><th className="p-2">Next action</th></tr></thead><tbody>{payload.records.map((record) => <tr key={`${record.clientId}:${record.sourceType}`} className="border-b"><td className="p-2 font-semibold">{record.clientName}</td><td className="p-2 uppercase">{record.sourceType}</td><td className="p-2">{record.status.replaceAll("_", " ")}</td><td className="p-2">{record.mappingStatus.replaceAll("_", " ")}</td><td className="p-2">{record.dataFreshness}</td><td className="p-2">{record.lastSuccessfulSyncAt ?? "Never"}</td><td className="p-2">{record.nextAction}{record.lastError ? ` Error: ${record.lastError}` : ""}</td></tr>)}</tbody></table></div></> : null}
  </section>;
}
