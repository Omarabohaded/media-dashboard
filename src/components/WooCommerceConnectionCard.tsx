"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/AppShell";

const fieldClass =
  "w-full rounded-[12px] border border-[var(--line)] bg-white/75 px-3 py-2.5 text-sm font-medium text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-white";
const primaryButtonClass =
  "rounded-[12px] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90";
const secondaryButtonClass =
  "rounded-[12px] border border-[var(--line)] bg-white/62 px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:bg-white";
const dangerButtonClass =
  "rounded-[12px] border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 transition hover:border-rose-400 hover:bg-rose-100";

type WooStatus = {
  configured: boolean;
  connected: boolean;
  previewReady: boolean;
  storeUrl: string;
  storeName: string | null;
  currencyCode: string | null;
  connectedAt: string | null;
  connectionError: string | null;
  recommendedNextStep: string;
};

type PreviewPayload = {
  snapshot?: {
    currencyCode: string;
    ordersCount: number;
    grossSales: number;
    averageOrderValue: number;
  };
  error?: string;
};

function Notice({ message, tone = "info" }: { message: string | null; tone?: "info" | "warn" }) {
  if (!message) return null;
  const styles = tone === "info" ? "border-cyan-200 bg-cyan-50 text-cyan-950" : "border-amber-200 bg-amber-50 text-amber-950";
  return <div className={`rounded-[14px] border px-3 py-2.5 text-sm ${styles}`}>{message}</div>;
}

function AdminStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[14px] border border-[var(--line)] bg-white/45 px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-lg font-semibold leading-6 text-[var(--ink)]">{value}</div>
      {hint ? <div className="mt-1 text-xs leading-5 text-[var(--muted)]">{hint}</div> : null}
    </div>
  );
}

function readyState(status: WooStatus | null) {
  if (status?.previewReady) return "Good";
  if (status?.configured) return "Watch";
  return "Fix";
}

export function WooCommerceConnectionCard({ activeClientId, activeClientName }: { activeClientId: string; activeClientName: string }) {
  const [status, setStatus] = useState<WooStatus | null>(null);
  const [storeUrl, setStoreUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadStatus() {
    if (!activeClientId) return;
    const response = await fetch(`/api/integrations/woocommerce/status?clientId=${encodeURIComponent(activeClientId)}`, { cache: "no-store" });
    const payload = (await response.json()) as WooStatus;
    setStatus(payload);
    setStoreUrl(payload.storeUrl ?? "");
    setApiKey("");
    setApiToken("");
  }

  useEffect(() => {
    void loadStatus().catch(() => setMessage("Could not load WooCommerce status."));
  }, [activeClientId]);

  async function saveConnection() {
    setBusy(true);
    setMessage(null);
    setPreview(null);
    const response = await fetch("/api/integrations/woocommerce/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: activeClientId, storeUrl, consumerKey: apiKey, ["consumer" + "Secret"]: apiToken }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setMessage(payload.error ?? "Could not connect WooCommerce for this client.");
      return;
    }
    await loadStatus();
    setMessage("WooCommerce connected and saved to this client.");
  }

  async function disconnect() {
    setBusy(true);
    const response = await fetch(`/api/integrations/woocommerce/status?clientId=${encodeURIComponent(activeClientId)}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) {
      setMessage("Could not disconnect WooCommerce.");
      return;
    }
    setPreview(null);
    await loadStatus();
    setMessage("WooCommerce was disconnected for this client.");
  }

  async function loadPreview() {
    setBusy(true);
    const response = await fetch(`/api/integrations/woocommerce/store-truth-preview?clientId=${encodeURIComponent(activeClientId)}`, { cache: "no-store" });
    const payload = (await response.json()) as PreviewPayload;
    setBusy(false);
    if (!response.ok) {
      setMessage(payload.error ?? "Could not load WooCommerce preview.");
      return;
    }
    setPreview(payload);
    setMessage("WooCommerce preview loaded from this client store.");
  }

  return (
    <div className="rounded-[16px] border border-[var(--line)] bg-white/52 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--ink)]">WooCommerce</div>
          <div className="mt-1 text-sm leading-5 text-[var(--muted)]">{status?.recommendedNextStep ?? "Add this client's WooCommerce store URL and REST API keys."}</div>
        </div>
        <StatusPill status={readyState(status)} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <AdminStat label="Client" value={activeClientName || "No client selected"} hint="Saved per client, not as global environment variables." />
        <AdminStat label="Connected Store" value={status?.storeName ?? "Not connected"} hint={status?.storeUrl || "Enter store URL and keys below."} />
      </div>
      <div className="mt-3 space-y-3">
        <Notice message={status?.connectionError ?? null} tone="warn" />
        <Notice message={message} tone={message?.toLowerCase().includes("could not") ? "warn" : "info"} />
      </div>
      <div className="mt-4 border-t border-[var(--line)] pt-4">
        <div className="grid gap-3">
          <input value={storeUrl} onChange={(event) => setStoreUrl(event.target.value)} placeholder="https://quffastore.com" className={fieldClass} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="REST API key" className={fieldClass} />
            <input value={apiToken} onChange={(event) => setApiToken(event.target.value)} placeholder="REST API token" className={fieldClass} />
          </div>
        </div>
        <div className="mt-2 text-xs leading-5 text-[var(--muted)]">Use read-only WooCommerce REST API credentials. The values are saved only for the selected client.</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void saveConnection()} disabled={busy} className={primaryButtonClass}>{status?.connected ? "Reconnect WooCommerce" : "Connect WooCommerce"}</button>
          <button type="button" onClick={() => void loadStatus()} disabled={busy} className={secondaryButtonClass}>Refresh</button>
          <button type="button" onClick={() => void loadPreview()} disabled={busy || !status?.connected} className={secondaryButtonClass}>Load Store Preview</button>
          <button type="button" onClick={() => void disconnect()} disabled={busy || !status?.configured} className={dangerButtonClass}>Disconnect</button>
        </div>
      </div>
      {preview?.snapshot ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <AdminStat label="Orders" value={`${preview.snapshot.ordersCount}`} hint="Recent WooCommerce orders" />
          <AdminStat label="Revenue" value={`${preview.snapshot.currencyCode} ${preview.snapshot.grossSales.toFixed(0)}`} hint={`AOV ${preview.snapshot.currencyCode} ${preview.snapshot.averageOrderValue.toFixed(0)}`} />
        </div>
      ) : null}
    </div>
  );
}
