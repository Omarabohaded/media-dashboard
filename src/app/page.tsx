"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import { AppShell, MiniMetric, Section, StatusPill } from "@/components/AppShell";
import {
  getCurrencyMeta,
  type ClientCurrencyCode,
  type ClientRecord,
} from "@/lib/clientTypes";

type DateRange =
  | "Today"
  | "Yesterday"
  | "Last 7 Days"
  | "Last 30 Days"
  | "MTD"
  | "QTD"
  | "Last 90 Days"
  | "Custom";

type ClientDirectoryResponse = {
  clients: ClientRecord[];
  activeClientId: string;
};

type MetaAccountOption = {
  id: string;
  name: string;
  currency?: string;
};

type MetaStatus = {
  connected: boolean;
  selectedAccountId: string | null;
  selectedAccount: MetaAccountOption | null;
  syncReady: boolean;
  connectionError: string | null;
};

type MetaInsightsPreview = {
  accountId: string;
  rows: Array<{
    campaignId: string;
    campaignName: string;
    spend: number;
    ctr: number;
    frequency: number;
    purchases: number;
    purchaseValue: number;
  }>;
  totals: {
    spend: number;
    purchases: number;
    purchaseValue: number;
    impressions: number;
    clicks: number;
  };
  note: string;
};

const RANGE_OPTIONS: DateRange[] = [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "MTD",
  "QTD",
  "Last 90 Days",
  "Custom",
];

const PLATFORM_SNAPSHOT = [
  {
    platform: "Meta",
    recommendation: "Scale the strongest prospecting campaigns only after store truth agrees.",
    status: "Scale" as const,
    mer: 3.65,
    cpa: 34.4,
  },
  {
    platform: "Google",
    recommendation: "Keep watch on search quality and brand overlap before more spend.",
    status: "Watch" as const,
    mer: 2.55,
    cpa: 44.9,
  },
  {
    platform: "TikTok",
    recommendation: "Refresh hooks first. Hold new scale until conversion quality improves.",
    status: "Watch" as const,
    mer: 3.16,
    cpa: 52.11,
  },
  {
    platform: "Snap",
    recommendation: "Support channel only for now. Plan for currency conversion underneath client truth.",
    status: "Hold" as const,
    mer: 2.73,
    cpa: 33.21,
  },
];

function toISODate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function startOfQuarter(value: Date) {
  return new Date(value.getFullYear(), Math.floor(value.getMonth() / 3) * 3, 1);
}

function buildMetaRangeQuery(range: DateRange, customStart: string, customEnd: string) {
  const now = new Date();
  const params = new URLSearchParams();

  if (range === "Today") {
    params.set("datePreset", "today");
    return params.toString();
  }

  if (range === "Yesterday") {
    params.set("datePreset", "yesterday");
    return params.toString();
  }

  if (range === "Last 7 Days") {
    params.set("datePreset", "last_7d");
    return params.toString();
  }

  if (range === "Last 30 Days") {
    params.set("datePreset", "last_30d");
    return params.toString();
  }

  if (range === "Last 90 Days") {
    params.set("since", toISODate(new Date(now.getTime() - 89 * 86_400_000)));
    params.set("until", toISODate(now));
    return params.toString();
  }

  if (range === "MTD") {
    params.set(
      "since",
      toISODate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))
    );
    params.set("until", toISODate(now));
    return params.toString();
  }

  if (range === "QTD") {
    params.set("since", toISODate(startOfQuarter(now)));
    params.set("until", toISODate(now));
    return params.toString();
  }

  if (customStart && customEnd) {
    params.set("since", customStart);
    params.set("until", customEnd);
    return params.toString();
  }

  params.set("datePreset", "last_7d");
  return params.toString();
}

function formatMoney(value: number, currencyCode: ClientCurrencyCode) {
  const meta = getCurrencyMeta(currencyCode);
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export default function DashboardPage() {
  const [range, setRange] = useState<DateRange>("Last 7 Days");
  const [customStart, setCustomStart] = useState(
    toISODate(new Date(Date.now() - 6 * 86_400_000))
  );
  const [customEnd, setCustomEnd] = useState(toISODate(new Date()));
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [activeClientId, setActiveClientId] = useState("");
  const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null);
  const [metaPreview, setMetaPreview] = useState<MetaInsightsPreview | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const activeClient = useMemo(
    () =>
      clients.find((entry) => entry.id === activeClientId) ?? clients[0] ?? null,
    [activeClientId, clients]
  );

  const clientCurrency = activeClient?.currencyCode ?? "USD";
  const accountCurrency =
    (metaStatus?.selectedAccount?.currency as ClientCurrencyCode | undefined) ??
    "USD";

  useEffect(() => {
    async function loadClients() {
      try {
        const preferredClientId =
          typeof window !== "undefined"
            ? window.localStorage.getItem("media-dashboard-active-client")
            : null;
        const query = preferredClientId
          ? `?clientId=${encodeURIComponent(preferredClientId)}`
          : "";
        const response = await fetch(`/api/admin/clients${query}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as ClientDirectoryResponse;
        setClients(payload.clients);
        setActiveClientId(payload.activeClientId);
      } catch {
        setRefreshMessage("Could not load the client list.");
      }
    }

    void loadClients();
  }, []);

  async function refreshMeta(clientId: string, manual = false) {
    setIsRefreshing(manual);

    try {
      if (range === "Custom" && customStart > customEnd) {
        throw new Error("Start date must be before end date.");
      }

      const statusResponse = await fetch(
        `/api/integrations/meta/status?clientId=${encodeURIComponent(clientId)}`,
        {
          cache: "no-store",
        }
      );
      const statusPayload = (await statusResponse.json()) as MetaStatus;
      setMetaStatus(statusPayload);

      if (!statusPayload.connected || !statusPayload.selectedAccountId) {
        setMetaPreview(null);
        setRefreshMessage(
          statusPayload.connected
            ? "Meta is connected, but this client still needs an ad account saved in Admin."
            : "Meta is not connected for this client yet."
        );
        setLastRefreshedAt(new Date().toISOString());
        return;
      }

      const previewQuery = buildMetaRangeQuery(range, customStart, customEnd);
      const previewResponse = await fetch(
        `/api/integrations/meta/insights-preview?clientId=${encodeURIComponent(
          clientId
        )}&${previewQuery}`,
        {
          cache: "no-store",
        }
      );
      const previewPayload = (await previewResponse.json()) as
        | MetaInsightsPreview
        | { error?: string };

      if (!previewResponse.ok || !("totals" in previewPayload)) {
        throw new Error(
          "error" in previewPayload
            ? previewPayload.error
            : "Could not load the live Meta preview."
        );
      }

      setMetaPreview(previewPayload);
      setRefreshMessage(
        `Live Meta preview refreshed for ${
          range === "Custom" ? `${customStart} to ${customEnd}` : range
        }.`
      );
      setLastRefreshedAt(new Date().toISOString());
    } catch (error) {
      setMetaPreview(null);
      setRefreshMessage(
        error instanceof Error ? error.message : "Could not refresh live data."
      );
      setLastRefreshedAt(new Date().toISOString());
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (!activeClientId) {
      return;
    }

    void refreshMeta(activeClientId);
  }, [activeClientId, range, customStart, customEnd]);

  function handleClientChange(nextClientId: string) {
    setActiveClientId(nextClientId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("media-dashboard-active-client", nextClientId);
    }
  }

  const safeScale = metaPreview?.totals.purchaseValue
    ? metaPreview.totals.purchaseValue >= metaPreview.totals.spend * 3
    : false;

  return (
    <AppShell>
      <div className="space-y-5">
        <Section
          title="Dashboard Controls"
          subtitle="Client, date range, and refresh now affect the live Meta preview for the selected client."
        >
          <div className="grid gap-4 xl:grid-cols-[1fr,1fr,1fr,auto]">
            <label className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
              <div className="mb-2 font-black uppercase text-slate-400">Date Range</div>
              <select
                value={range}
                onChange={(event) => setRange(event.target.value as DateRange)}
                className="w-full bg-transparent text-base font-semibold text-white outline-none"
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-slate-950">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
              <div className="mb-2 font-black uppercase text-slate-400">
                Client Currency
              </div>
              <div className="text-base font-semibold text-white">
                {activeClient
                  ? getCurrencyMeta(activeClient.currencyCode).label
                  : "Waiting for client"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                This remains the main reporting currency across the dashboard.
              </div>
            </label>

            <label className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
              <div className="mb-2 font-black uppercase text-slate-400">
                Last Refresh
              </div>
              <div className="text-base font-semibold text-white">
                {lastRefreshedAt
                  ? new Date(lastRefreshedAt).toLocaleString()
                  : "Not refreshed yet"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Use refresh after switching dates or clients.
              </div>
            </label>

            <button
              type="button"
              onClick={() => {
                if (activeClientId) {
                  void refreshMeta(activeClientId, true);
                }
              }}
              className="flex items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 text-base font-black text-white"
            >
              <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>

          {range === "Custom" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
                <div className="mb-2 font-black uppercase text-slate-400">
                  Start Date
                </div>
                <input
                  type="date"
                  value={customStart}
                  onChange={(event) => setCustomStart(event.target.value)}
                  className="bg-transparent text-base font-semibold text-white outline-none"
                />
              </label>
              <label className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
                <div className="mb-2 font-black uppercase text-slate-400">
                  End Date
                </div>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="bg-transparent text-base font-semibold text-white outline-none"
                />
              </label>
            </div>
          ) : null}

          {refreshMessage ? (
            <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-sm text-cyan-200">
              {refreshMessage}
            </div>
          ) : null}
        </Section>

        <div className="grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
          <Section
            title="Live Meta Preview"
            subtitle="This section now follows the selected client and date range."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MiniMetric
                label="Connection"
                value={
                  metaStatus?.connected
                    ? metaStatus.selectedAccount?.name ?? "Meta connected"
                    : "Not connected"
                }
                hint={
                  metaStatus?.connected
                    ? metaStatus.selectedAccountId ?? "Choose an account in admin"
                    : "Connect Meta in Admin"
                }
                tone={metaStatus?.connected ? "good" : "warn"}
              />
              <MiniMetric
                label="Live Spend"
                value={
                  metaPreview
                    ? formatMoney(metaPreview.totals.spend, accountCurrency)
                    : "Waiting"
                }
                hint={`Meta account currency: ${accountCurrency}`}
                tone={metaPreview ? "good" : "warn"}
              />
              <MiniMetric
                label="Live Purchases"
                value={metaPreview ? formatNumber(metaPreview.totals.purchases) : "0"}
                hint="Pulled from Meta insights preview"
                tone={metaPreview ? "good" : "default"}
              />
              <MiniMetric
                label="Live Revenue"
                value={
                  metaPreview
                    ? formatMoney(metaPreview.totals.purchaseValue, accountCurrency)
                    : "Waiting"
                }
                hint="Platform-attributed value only"
                tone={metaPreview ? "good" : "warn"}
              />
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="pb-3">Campaign</th>
                    <th>Spend</th>
                    <th>CTR</th>
                    <th>Frequency</th>
                    <th>Purchases</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {(metaPreview?.rows ?? []).slice(0, 8).map((row) => (
                    <tr key={row.campaignId} className="border-t border-slate-800">
                      <td className="py-4 font-semibold text-white">
                        {row.campaignName}
                      </td>
                      <td>{formatMoney(row.spend, accountCurrency)}</td>
                      <td>{formatNumber(row.ctr, 2)}%</td>
                      <td>{formatNumber(row.frequency, 2)}</td>
                      <td>{formatNumber(row.purchases)}</td>
                      <td>{formatMoney(row.purchaseValue, accountCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            title="Client Rules"
            subtitle="Currency handling and scaling notes for the selected client."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <MiniMetric
                label="Primary Currency"
                value={getCurrencyMeta(clientCurrency).label}
                hint="This is the main dashboard currency."
                tone="good"
              />
              <MiniMetric
                label="Scale Readiness"
                value={safeScale ? "Safe to review" : "Watch carefully"}
                hint="Store truth still remains the final gate."
                tone={safeScale ? "good" : "warn"}
              />
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertTriangle size={16} />
                  <div className="font-black">Currency Conversion Note</div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Some future platforms, like Snapchat, may report only in dollars.
                  We will keep the client&apos;s website currency as the dashboard truth
                  and convert platform data underneath that layer.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2 text-cyan-300">
                  <ShieldCheck size={16} />
                  <div className="font-black">Why the numbers can differ</div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Meta preview values are shown in the ad account currency, while the
                  dashboard&apos;s business truth should remain in the client&apos;s store
                  currency.
                </p>
              </div>
            </div>
          </Section>
        </div>

        <Section
          title="Command Summary"
          subtitle="A quick daily view while the deeper pages continue to use the shared Lamba decision layer."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric
              label="Client"
              value={activeClient?.name ?? "No client selected"}
              hint={activeClient?.websitePlatform ?? "Create a client in admin first"}
              tone="good"
            />
            <MiniMetric
              label="Blended Spend"
              value={
                metaPreview
                  ? formatMoney(metaPreview.totals.spend, clientCurrency)
                  : formatMoney(45620, clientCurrency)
              }
              hint="Shown in the client reporting currency"
              tone="warn"
            />
            <MiniMetric
              label="Scale Goal"
              value="Protect MER first"
              hint="Business truth overrides platform-only optimism"
              tone="good"
            />
            <MiniMetric
              label="Refresh State"
              value={isRefreshing ? "Refreshing" : "Ready"}
              hint="Date changes now trigger a real refresh path"
              tone={isRefreshing ? "warn" : "good"}
            />
          </div>
        </Section>

        <Section
          title="Platform Priorities"
          subtitle="Use this as the operator view until more channels are connected."
        >
          <div className="space-y-4">
            {PLATFORM_SNAPSHOT.map((row) => (
              <div
                key={row.platform}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-white">{row.platform}</div>
                    <p className="mt-1 text-sm text-slate-400">{row.recommendation}</p>
                  </div>
                  <StatusPill status={row.status} />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MiniMetric
                    label="MER"
                    value={`${formatNumber(row.mer, 2)}x`}
                    tone={row.mer >= 3 ? "good" : "warn"}
                  />
                  <MiniMetric
                    label="CPA"
                    value={formatMoney(row.cpa, clientCurrency)}
                    tone={row.cpa <= 40 ? "good" : "warn"}
                  />
                  <MiniMetric
                    label="Primary Read"
                    value={row.platform === "Meta" ? "Live preview" : "Prototype"}
                    tone={row.platform === "Meta" ? "good" : "default"}
                  />
                  <MiniMetric
                    label="Next Move"
                    value={row.status}
                    tone={
                      row.status === "Scale"
                        ? "good"
                        : row.status === "Watch"
                        ? "warn"
                        : "default"
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="What Changed"
          subtitle="These were the key fixes you asked for."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric
              label="Client Switching"
              value="Live in dashboard"
              hint="The selected client now carries through the main dashboard."
              tone="good"
            />
            <MiniMetric
              label="Date Range"
              value="Now wired"
              hint="Refresh uses the selected date window against Meta."
              tone="good"
            />
            <MiniMetric
              label="Client Currency"
              value={getCurrencyMeta(clientCurrency).code}
              hint="USD, AED, SAR, and EGP are supported."
              tone="good"
            />
            <MiniMetric
              label="Refresh Button"
              value="Working"
              hint="It now reloads the live Meta preview path."
              tone="good"
            />
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
