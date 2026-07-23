"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  DiscoveredSourceConversionEvent,
  PaidMediaSourceType,
  SourceConversionMappingStatus,
} from "@/lib/paidMediaContract";

type TikTokStatus = {
  configured: boolean;
  connected: boolean;
  accounts: Array<{ advertiserId: string; advertiserName: string }>;
  selectedAdvertiserId: string | null;
  selectedAdvertiser: { advertiserId: string; advertiserName: string } | null;
  missingEnv: string[];
  connectionError: string | null;
  tokenExpired: boolean;
  lastDiscoveryAt: string | null;
  mappingHealthy: boolean;
  recommendedNextStep: string;
};

type MappingDraft = {
  purchasesEvent: string;
  purchaseValueEvent: string;
  status: SourceConversionMappingStatus;
};

const sources: Array<{ value: PaidMediaSourceType; label: string }> = [
  { value: "meta", label: "Meta" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google Ads" },
  { value: "snap", label: "Snapchat" },
];
const inputClass =
  "w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-sm text-[var(--ink)]";
const buttonClass =
  "rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white";
const secondaryClass =
  "rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]";

export function AdminPaidMediaSetup({ clientId }: { clientId: string }) {
  const [tiktok, setTikTok] = useState<TikTokStatus | null>(null);
  const [events, setEvents] = useState<DiscoveredSourceConversionEvent[]>([]);
  const [advertiserId, setAdvertiserId] = useState("");
  const [source, setSource] = useState<PaidMediaSourceType>("tiktok");
  const [scope, setScope] = useState<"global" | "client">("client");
  const [draft, setDraft] = useState<MappingDraft>({
    purchasesEvent: "",
    purchaseValueEvent: "",
    status: "missing_mapping",
  });
  const [message, setMessage] = useState("");

  const loadMappings = useCallback(async (selectedSource = source) => {
    if (!clientId) return;
    const response = await fetch(
      `/api/admin/source-conversion-mappings?clientId=${encodeURIComponent(clientId)}`,
      { cache: "no-store" }
    );
    const payload = (await response.json()) as {
      mappings?: Array<{
        sourceType: PaidMediaSourceType;
        scope: "global" | "client";
        clientId: string | null;
        purchasesEvent: string | null;
        purchaseValueEvent: string | null;
      }>;
      resolved?: Array<MappingDraft & { sourceType: PaidMediaSourceType }>;
    };
    const exact = payload.mappings?.find(
      (item) =>
        item.sourceType === selectedSource &&
        item.scope === scope &&
        (scope === "global" || item.clientId === clientId)
    );
    const resolved = payload.resolved?.find((item) => item.sourceType === selectedSource);
    setDraft({
      purchasesEvent: exact?.purchasesEvent ?? resolved?.purchasesEvent ?? "",
      purchaseValueEvent: exact?.purchaseValueEvent ?? resolved?.purchaseValueEvent ?? "",
      status: resolved?.status ?? "missing_mapping",
    });
  }, [clientId, scope, source]);

  const loadTikTok = useCallback(async () => {
    if (!clientId) return;
    const response = await fetch(
      `/api/integrations/tiktok/status?clientId=${encodeURIComponent(clientId)}`,
      { cache: "no-store" }
    );
    const payload = (await response.json()) as TikTokStatus & { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Could not load TikTok status.");
      return;
    }
    setTikTok(payload);
    setAdvertiserId(payload.selectedAdvertiserId ?? payload.accounts[0]?.advertiserId ?? "");
  }, [clientId]);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void Promise.all([loadTikTok(), loadMappings()]);
    }, 0);
    return () => window.clearTimeout(task);
  }, [loadMappings, loadTikTok]);

  async function saveAdvertiser() {
    const account = tiktok?.accounts.find((item) => item.advertiserId === advertiserId);
    const response = await fetch(
      `/api/integrations/tiktok/accounts?clientId=${encodeURIComponent(clientId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advertiserId,
          advertiserName: account?.advertiserName,
        }),
      }
    );
    const payload = (await response.json()) as { error?: string };
    setMessage(response.ok ? "TikTok advertiser saved to this client." : payload.error ?? "Save failed.");
    if (response.ok) await loadTikTok();
  }

  async function discoverEvents() {
    const response = await fetch(
      `/api/integrations/tiktok/events-preview?clientId=${encodeURIComponent(clientId)}`,
      { cache: "no-store" }
    );
    const payload = (await response.json()) as {
      events?: DiscoveredSourceConversionEvent[];
      error?: string;
    };
    setEvents(payload.events ?? []);
    setMessage(response.ok ? `Detected ${payload.events?.length ?? 0} TikTok events.` : payload.error ?? "Discovery failed.");
    await loadTikTok();
  }

  async function saveMapping() {
    const response = await fetch("/api/admin/source-conversion-mappings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType: source,
        scope,
        clientId: scope === "client" ? clientId : null,
        purchasesEvent: draft.purchasesEvent,
        purchaseValueEvent: draft.purchaseValueEvent,
        enabled: true,
      }),
    });
    const payload = (await response.json()) as { error?: string; resolved?: MappingDraft };
    setMessage(response.ok ? "Conversion mapping saved." : payload.error ?? "Mapping save failed.");
    if (payload.resolved) setDraft((current) => ({ ...current, status: payload.resolved!.status }));
    await loadTikTok();
  }

  return (
    <section id="paid-media-connections" className="rounded-[18px] border border-[var(--line)] bg-white/58 p-4">
      <div className="border-b border-[var(--line)] pb-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Paid Media Sources
        </div>
        <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">TikTok and Conversion Mapping</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Connections, advertiser selection, discovered events, global defaults, and client overrides share one mapping model.
        </p>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">TikTok</div>
              <div className="text-sm text-[var(--muted)]">{tiktok?.recommendedNextStep ?? "Loading status…"}</div>
            </div>
            <span className="rounded-full border px-2 py-1 text-xs font-semibold">
              {tiktok?.connected ? (tiktok.tokenExpired ? "Token expired" : "Connected") : "Awaiting connection"}
            </span>
          </div>
          <div className="mt-3 grid gap-3">
            <select className={inputClass} value={advertiserId} onChange={(event) => setAdvertiserId(event.target.value)}>
              <option value="">Choose advertiser</option>
              {(tiktok?.accounts ?? []).map((account) => (
                <option key={account.advertiserId} value={account.advertiserId}>
                  {account.advertiserName} · {account.advertiserId}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              <a className={buttonClass} href={`/api/integrations/tiktok/connect?clientId=${encodeURIComponent(clientId)}`}>
                {tiktok?.connected ? "Reconnect TikTok" : "Connect TikTok"}
              </a>
              <button className={secondaryClass} type="button" onClick={() => void saveAdvertiser()} disabled={!advertiserId}>
                Save advertiser
              </button>
              <button className={secondaryClass} type="button" onClick={() => void discoverEvents()}>
                Discover events
              </button>
            </div>
            {tiktok?.missingEnv.length ? (
              <div className="text-sm text-amber-800">Awaiting live validation: {tiktok.missingEnv.join(", ")}</div>
            ) : null}
            <div className="text-xs text-[var(--muted)]">
              Last discovery: {tiktok?.lastDiscoveryAt ?? "Never"} · Mapping: {tiktok?.mappingHealthy ? "healthy" : "missing"}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-4">
          <div className="font-semibold">Source conversion mapping</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select className={inputClass} value={source} onChange={(event) => {
              const next = event.target.value as PaidMediaSourceType;
              setSource(next);
              void loadMappings(next);
            }}>
              {sources.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select className={inputClass} value={scope} onChange={(event) => setScope(event.target.value as "global" | "client")}>
              <option value="client">Client override</option>
              <option value="global">Global default</option>
            </select>
            <input className={inputClass} list="purchase-events" placeholder="Purchases event" value={draft.purchasesEvent} onChange={(event) => setDraft({ ...draft, purchasesEvent: event.target.value })} />
            <input className={inputClass} list="value-events" placeholder="Purchase-value event" value={draft.purchaseValueEvent} onChange={(event) => setDraft({ ...draft, purchaseValueEvent: event.target.value })} />
          </div>
          <datalist id="purchase-events">
            {events.filter((event) => event.roles.includes("purchases")).map((event) => <option key={event.eventName} value={event.eventName}>{event.label}</option>)}
          </datalist>
          <datalist id="value-events">
            {events.filter((event) => event.roles.includes("purchaseValue")).map((event) => <option key={event.eventName} value={event.eventName}>{event.label}</option>)}
          </datalist>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--muted)]">Resolved status: {draft.status.replaceAll("_", " ")}</span>
            <button className={buttonClass} type="button" onClick={() => void saveMapping()}>Save mapping</button>
          </div>
        </div>
      </div>
      {message ? <div className="mt-3 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2 text-sm">{message}</div> : null}
    </section>
  );
}
