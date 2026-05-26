"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  AppShell,
  DashboardLoadingState,
  EmptySectionState,
  MiniMetric,
  Section,
  SourcePill,
} from "@/components/AppShell";
import {
  getCurrencyMeta,
  type ClientCurrencyCode,
  type ClientRecord,
} from "@/lib/clientTypes";
import { getFunnelReadiness } from "@/lib/funnelReadiness";
import { evaluateTrackingGap } from "@/lib/workbookSignals";

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
    addToCart?: number;
    checkoutInitiated?: number;
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

type StoreStatus = {
  platform: string;
  configured: boolean;
  connected: boolean;
  previewReady: boolean;
  storeDomain?: string;
  siteUrl?: string;
  missingEnv: string[];
  connectionError: string | null;
  recommendedNextStep: string;
};

type StorePreview = {
  note: string;
  snapshot: {
    shopName?: string;
    storeName?: string;
    currencyCode: string;
    ordersCount: number;
    grossSales: number;
    taxTotal: number;
    shippingTotal: number;
    netSales: number;
    averageOrderValue: number;
  };
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

function toISODate(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
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
    params.set("since", toISODate(new Date(now.getFullYear(), now.getMonth(), 1)));
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
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);
  const [storePreview, setStorePreview] = useState<StorePreview | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
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

  const hasStoreTruth = Boolean(storePreview);
  const hasMetaPreview = Boolean(metaPreview);
  const storeCurrency =
    (storePreview?.snapshot.currencyCode as ClientCurrencyCode | undefined) ??
    clientCurrency;
  const trackingGap = evaluateTrackingGap({
    storeRevenue: hasStoreTruth ? storePreview?.snapshot.grossSales : undefined,
    platformRevenue: hasMetaPreview ? metaPreview?.totals.purchaseValue : undefined,
    storeOrders: hasStoreTruth ? storePreview?.snapshot.ordersCount : undefined,
    platformPurchases: hasMetaPreview ? metaPreview?.totals.purchases : undefined,
  });
  const funnelReadiness = getFunnelReadiness({
    storePreview: storePreview
      ? {
          platform:
            activeClient?.websitePlatform === "wordpress" ? "wordpress" : "shopify",
          storeName:
            storePreview.snapshot.shopName ??
            storePreview.snapshot.storeName ??
            "Store source",
          currencyCode: storePreview.snapshot.currencyCode,
          ordersCount: storePreview.snapshot.ordersCount,
          grossSales: storePreview.snapshot.grossSales,
          taxTotal: storePreview.snapshot.taxTotal,
          shippingTotal: storePreview.snapshot.shippingTotal,
          netSales: storePreview.snapshot.netSales,
          averageOrderValue: storePreview.snapshot.averageOrderValue,
          note: storePreview.note,
        }
      : null,
    metaPreview,
    analyticsConnected: false,
  });
  const purchaseCvrMetric = funnelReadiness.find(
    (metric) => metric.id === "purchase_cvr"
  );

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
        const nextClientId =
          preferredClientId &&
          payload.clients.some((entry) => entry.id === preferredClientId)
            ? preferredClientId
            : payload.activeClientId;
        setClients(payload.clients);
        setActiveClientId(nextClientId);
        if (!nextClientId) {
          setIsBooting(false);
        }
      } catch {
        setRefreshMessage("Could not load the client list.");
        setIsBooting(false);
      }
    }

    void loadClients();
  }, []);

  async function refreshMeta(clientId: string, manual = false) {
    setIsRefreshing(manual);
    setRefreshMessage(null);

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

      const client =
        clients.find((entry) => entry.id === clientId) ??
        activeClient ??
        null;

      if (client?.websitePlatform === "shopify" || client?.websitePlatform === "wordpress") {
        const websitePlatform = client.websitePlatform;
        const storeStatusResponse = await fetch(
          `/api/integrations/${websitePlatform}/status`,
          {
            cache: "no-store",
          }
        );
        const nextStoreStatus = (await storeStatusResponse.json()) as StoreStatus;
        setStoreStatus(nextStoreStatus);

        if (nextStoreStatus.previewReady) {
          const storePreviewResponse = await fetch(
            `/api/integrations/${websitePlatform}/store-truth-preview`,
            {
              cache: "no-store",
            }
          );
          const nextStorePreview = (await storePreviewResponse.json()) as
            | StorePreview
            | { error?: string };

          if (storePreviewResponse.ok && "snapshot" in nextStorePreview) {
            setStorePreview(nextStorePreview);
          } else {
            setStorePreview(null);
          }
        } else {
          setStorePreview(null);
        }
      } else {
        setStoreStatus(null);
        setStorePreview(null);
      }

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
      setIsBooting(false);
    }
  }

  useEffect(() => {
    if (!activeClientId) {
      return;
    }

    void refreshMeta(activeClientId);
  }, [activeClientId, range, customStart, customEnd]);

  const safeScale = metaPreview?.totals.purchaseValue
    ? hasStoreTruth
      ? storePreview!.snapshot.grossSales >= metaPreview.totals.spend * 2.2 &&
        !trackingGap.active
      : false
    : false;

  if (isBooting) {
    return (
      <AppShell>
        <DashboardLoadingState
          title="Loading command center"
          description="Pulling the active client, live Meta preview, date range state, and source readiness."
        />
      </AppShell>
    );
  }

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
            subtitle="This section follows the selected client and date range, and it now stays honest about whether live media data is available."
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <SourcePill
                label={metaStatus?.connected ? "Meta connected" : "Meta not connected"}
                tone={metaStatus?.connected ? "good" : "warn"}
              />
              <SourcePill
                label={hasMetaPreview ? "Live preview loaded" : "No live preview yet"}
                tone={hasMetaPreview ? "good" : "warn"}
              />
              <SourcePill
                label={hasStoreTruth ? "Store truth connected" : "Store truth still missing"}
                tone={hasStoreTruth ? "good" : "warn"}
              />
              <SourcePill
                label={
                  trackingGap.ready
                    ? trackingGap.active
                      ? "Tracking gap active"
                      : "Tracking gap within range"
                    : "Tracking gap not ready"
                }
                tone={
                  trackingGap.status === "danger"
                    ? "bad"
                    : trackingGap.status === "warning"
                    ? "warn"
                    : trackingGap.status === "healthy"
                    ? "good"
                    : "default"
                }
              />
            </div>
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
                    : "Waiting for live data"
                }
                hint={`Meta account currency: ${accountCurrency}`}
                tone={metaPreview ? "good" : "warn"}
              />
              <MiniMetric
                label="Live Purchases"
                value={
                  metaPreview ? formatNumber(metaPreview.totals.purchases) : "Waiting"
                }
                hint="Pulled from Meta insights preview"
                tone={metaPreview ? "good" : "warn"}
              />
              <MiniMetric
                label="Live Revenue"
                value={
                  metaPreview
                    ? formatMoney(metaPreview.totals.purchaseValue, accountCurrency)
                    : "Waiting for live data"
                }
                hint="Platform-attributed value only"
                tone={metaPreview ? "good" : "warn"}
              />
            </div>

            {metaPreview?.rows.length ? (
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
                    {metaPreview.rows.slice(0, 8).map((row) => (
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
            ) : (
              <div className="mt-5">
                <EmptySectionState
                  title="No live Meta rows are ready for this client yet"
                  description="This table stays empty until the selected client has a connected Meta account and a saved ad account. It no longer falls back to believable demo campaign data."
                />
              </div>
            )}
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
                value={
                  hasMetaPreview && hasStoreTruth
                    ? safeScale
                      ? "Safe to review"
                      : "Watch carefully"
                    : "Not decision-ready"
                }
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
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="font-black text-white">Source Status</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {hasStoreTruth
                    ? `Store truth is currently coming from ${
                        storePreview?.snapshot.shopName ||
                        storePreview?.snapshot.storeName ||
                        storeStatus?.storeDomain ||
                        storeStatus?.siteUrl ||
                        "the website source"
                      }.`
                    : storeStatus?.recommendedNextStep ||
                      "Connect the website source to unlock MER, AOV, and business-health metrics."}
                </p>
              </div>
            </div>
          </Section>
        </div>

        <Section
          title="Command Summary"
          subtitle="A quick daily view with honest live, partial, and not-connected states."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric
              label="Client"
              value={activeClient?.name ?? "No client selected"}
              hint={activeClient?.websitePlatform ?? "Create a client in admin first"}
              tone="good"
            />
            <MiniMetric
              label="Ad Spend"
              value={
                metaPreview
                  ? formatMoney(metaPreview.totals.spend, clientCurrency)
                  : "Waiting for live data"
              }
              hint="Shown only when the platform source is connected"
              tone="warn"
            />
            <MiniMetric
              label="Store Revenue"
              value={
                hasStoreTruth
                  ? formatMoney(storePreview!.snapshot.grossSales, storeCurrency)
                  : "Waiting for store truth"
              }
              hint="Website/store truth only"
              tone={hasStoreTruth ? "good" : "warn"}
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
          title="Source Readiness"
          subtitle="The workbook expects business truth and platform truth to be separated clearly."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric
              label="Meta"
              value={hasMetaPreview ? "Live preview active" : "Waiting"}
              hint={
                metaStatus?.connected
                  ? metaStatus.selectedAccount?.name ?? "Ad account still needs saving"
                  : "Connect Meta in Admin"
              }
              tone={hasMetaPreview ? "good" : "warn"}
            />
            <MiniMetric
              label="Store Truth"
              value={hasStoreTruth ? "Live website truth" : "Waiting"}
              hint={
                hasStoreTruth
                  ? storePreview?.snapshot.shopName ||
                    storePreview?.snapshot.storeName ||
                    "Connected source"
                  : storeStatus?.recommendedNextStep || "Connect the website source"
              }
              tone={hasStoreTruth ? "good" : "warn"}
            />
            <MiniMetric
              label="MER Readiness"
              value={hasMetaPreview && hasStoreTruth ? "Ready" : "Blocked"}
              hint="Needs both spend and store revenue"
              tone={hasMetaPreview && hasStoreTruth ? "good" : "warn"}
            />
            <MiniMetric
              label="Tracking Gap"
              value={
                trackingGap.ready
                  ? trackingGap.active
                    ? "Review"
                    : "Within range"
                  : "Waiting"
              }
              hint={trackingGap.summary}
              tone={
                trackingGap.status === "danger"
                  ? "bad"
                  : trackingGap.status === "warning"
                  ? "warn"
                  : trackingGap.status === "healthy"
                  ? "good"
                  : "warn"
              }
            />
            <MiniMetric
              label="Purchase CVR"
              value={purchaseCvrMetric?.value ?? "Blocked"}
              hint={purchaseCvrMetric?.hint ?? "Needs website session truth"}
              tone={
                purchaseCvrMetric?.state === "ready"
                  ? "good"
                  : purchaseCvrMetric?.state === "partial"
                  ? "default"
                  : "warn"
              }
            />
          </div>
        </Section>

        <Section
          title="Workbook Logic"
          subtitle="This is how the current dashboard maps to the uploaded metric dictionary."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric
              label="Store Revenue"
              value="Website truth"
              hint="Shopify or WordPress/WooCommerce should own this metric."
              tone="good"
            />
            <MiniMetric
              label="Ad Spend"
              value="Platform truth"
              hint="This is currently coming from the connected Meta account."
              tone="good"
            />
            <MiniMetric
              label="MER"
              value={hasMetaPreview && hasStoreTruth ? "Applied" : "Waiting on both sources"}
              hint="Store revenue divided by total ad spend"
              tone={hasMetaPreview && hasStoreTruth ? "good" : "warn"}
            />
            <MiniMetric
              label="Tracking Gap Signal"
              value={
                trackingGap.ready
                  ? trackingGap.active
                    ? "Applied and warning"
                    : "Applied and healthy"
                  : "Waiting on both truths"
              }
              hint="Workbook rule: compare platform attribution against store truth before trusting scale."
              tone={
                trackingGap.status === "danger"
                  ? "bad"
                  : trackingGap.status === "warning"
                  ? "warn"
                  : trackingGap.status === "healthy"
                  ? "good"
                  : "warn"
              }
            />
            <MiniMetric
              label="Sessions and Funnel"
              value="Readiness layer added"
              hint="The dashboard now distinguishes blocked metrics from partial platform proxies, but final funnel truth still needs analytics."
              tone="warn"
            />
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
