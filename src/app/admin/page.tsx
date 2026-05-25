"use client";

import { useEffect, useState } from "react";
import { AppShell, MiniMetric, Section, StatusPill } from "../../components/AppShell";
import { Plug, ShieldCheck, Store, Workflow } from "lucide-react";

type MetaAccountOption = {
  id: string;
  name: string;
  currency?: string;
  timezone_name?: string;
};

type MetaStatus = {
  platform: "meta";
  configured: boolean;
  connected: boolean;
  appMode: string;
  scopes: string[];
  callbackUrl: string;
  missingEnv: string[];
  usesMockData: boolean;
  selectedAccountId: string | null;
  selectedAccount: MetaAccountOption | null;
  accounts: MetaAccountOption[];
  connectionError: string | null;
  syncReady: boolean;
  recommendedNextStep: string;
};

type MetaInsightsPreview = {
  accountId: string;
  rows: Array<{
    campaignId: string;
    campaignName: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    cpm: number;
    frequency: number;
    reach: number;
    purchases: number;
    purchaseValue: number;
    addToCart: number;
    checkoutInitiated: number;
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

type ShopifyStatus = {
  platform: "shopify";
  configured: boolean;
  connected: boolean;
  previewReady: boolean;
  storeDomain: string;
  apiVersion: string;
  requestedScopes: string[];
  missingEnv: string[];
  usesMockData: boolean;
  shopName: string | null;
  connectionError: string | null;
  recommendedNextStep: string;
};

type ShopifyStoreTruthPreview = {
  snapshot: {
    shopName: string;
    currencyCode: string;
    primaryDomainUrl: string;
    ordersCount: number;
    grossSales: number;
    taxTotal: number;
    shippingTotal: number;
    netSales: number;
    averageOrderValue: number;
  };
  orders: Array<{
    id: string;
    name: string;
    createdAt: string;
    totalPrice: number;
    taxTotal: number;
    shippingTotal: number;
    lineItemsQuantity: number;
    financialStatus: string;
  }>;
  note: string;
};

function Surface({
  title,
  eyebrow,
  status,
  children,
}: {
  title: string;
  eyebrow: string;
  status: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-slate-400">
            {eyebrow}
          </div>
          <h3 className="mt-2 text-2xl font-black text-white">{title}</h3>
        </div>
        <StatusPill status={status} />
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EnvList({ values }: { values: string[] }) {
  if (!values.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4">
      <div className="text-sm font-bold uppercase text-red-300">
        Missing Environment Values
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-full bg-red-950/70 px-3 py-1 text-xs font-bold text-red-200"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function MessageBox({
  tone = "warn",
  message,
}: {
  tone?: "warn" | "info";
  message: string | null;
}) {
  if (!message) {
    return null;
  }

  const styles =
    tone === "info"
      ? "border-cyan-500/30 bg-cyan-950/20 text-cyan-200"
      : "border-amber-500/30 bg-amber-950/20 text-amber-200";

  return <div className={`rounded-2xl border p-4 text-sm ${styles}`}>{message}</div>;
}

export default function AdminPage() {
  const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null);
  const [metaInsights, setMetaInsights] = useState<MetaInsightsPreview | null>(null);
  const [shopifyStatus, setShopifyStatus] = useState<ShopifyStatus | null>(null);
  const [shopifyPreview, setShopifyPreview] = useState<ShopifyStoreTruthPreview | null>(null);
  const [accountDraft, setAccountDraft] = useState("");
  const [metaMessage, setMetaMessage] = useState<string | null>(null);
  const [shopifyMessage, setShopifyMessage] = useState<string | null>(null);
  const [isMetaLoading, setIsMetaLoading] = useState(true);
  const [isMetaPreviewLoading, setIsMetaPreviewLoading] = useState(false);
  const [isShopifyLoading, setIsShopifyLoading] = useState(true);
  const [isShopifyPreviewLoading, setIsShopifyPreviewLoading] = useState(false);

  async function loadMetaStatus() {
    setIsMetaLoading(true);

    try {
      const response = await fetch("/api/integrations/meta/status", {
        cache: "no-store",
      });
      const payload = (await response.json()) as MetaStatus;
      setMetaStatus(payload);
      setAccountDraft(payload.selectedAccountId ?? payload.accounts[0]?.id ?? "");
    } catch (error) {
      setMetaMessage(
        error instanceof Error ? error.message : "Could not load Meta status."
      );
    } finally {
      setIsMetaLoading(false);
    }
  }

  async function loadShopifyStatus() {
    setIsShopifyLoading(true);

    try {
      const response = await fetch("/api/integrations/shopify/status", {
        cache: "no-store",
      });
      const payload = (await response.json()) as ShopifyStatus;
      setShopifyStatus(payload);
    } catch (error) {
      setShopifyMessage(
        error instanceof Error ? error.message : "Could not load Shopify status."
      );
    } finally {
      setIsShopifyLoading(false);
    }
  }

  useEffect(() => {
    void loadMetaStatus();
    void loadShopifyStatus();
  }, []);

  async function handleDisconnectMeta() {
    setMetaMessage(null);

    const response = await fetch("/api/integrations/meta/status", {
      method: "DELETE",
    });

    if (!response.ok) {
      setMetaMessage("Could not disconnect Meta.");
      return;
    }

    setMetaInsights(null);
    await loadMetaStatus();
  }

  async function handleAccountSelect() {
    if (!accountDraft) {
      setMetaMessage("Choose an ad account first.");
      return;
    }

    setMetaMessage(null);

    const response = await fetch("/api/integrations/meta/account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountId: accountDraft }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setMetaMessage(payload.error ?? "Could not save the Meta ad account.");
      return;
    }

    await loadMetaStatus();
  }

  async function handleMetaPreview() {
    setMetaMessage(null);
    setIsMetaPreviewLoading(true);

    try {
      const response = await fetch("/api/integrations/meta/insights-preview", {
        cache: "no-store",
      });
      const payload = (await response.json()) as MetaInsightsPreview & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load Meta preview.");
      }

      setMetaInsights(payload);
    } catch (error) {
      setMetaMessage(
        error instanceof Error ? error.message : "Could not load Meta preview."
      );
    } finally {
      setIsMetaPreviewLoading(false);
    }
  }

  async function handleShopifyConnect() {
    setShopifyMessage(null);
    setIsShopifyLoading(true);

    try {
      const response = await fetch("/api/integrations/shopify/connect", {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not connect Shopify.");
      }

      await loadShopifyStatus();
    } catch (error) {
      setShopifyMessage(
        error instanceof Error ? error.message : "Could not connect Shopify."
      );
    } finally {
      setIsShopifyLoading(false);
    }
  }

  async function handleShopifyPreview() {
    setShopifyMessage(null);
    setIsShopifyPreviewLoading(true);

    try {
      const response = await fetch(
        "/api/integrations/shopify/store-truth-preview",
        {
          cache: "no-store",
        }
      );
      const payload = (await response.json()) as ShopifyStoreTruthPreview & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ?? "Could not load Shopify store-truth preview."
        );
      }

      setShopifyPreview(payload);
    } catch (error) {
      setShopifyMessage(
        error instanceof Error
          ? error.message
          : "Could not load Shopify store truth."
      );
    } finally {
      setIsShopifyPreviewLoading(false);
    }
  }

  const metaReadyState = metaStatus?.connected
    ? "Good"
    : metaStatus?.configured
    ? "Watch"
    : "Fix";
  const shopifyReadyState = shopifyStatus?.previewReady
    ? "Good"
    : shopifyStatus?.configured
    ? "Watch"
    : "Fix";

  return (
    <AppShell>
      <div className="space-y-5">
        <Section
          title="Official API Onboarding"
          subtitle="Use each platform's official developer workflow first. Meta is the first media source, and Shopify is the first business-truth source."
        >
          <div className="grid gap-5 xl:grid-cols-2">
            <Surface
              eyebrow="Meta Marketing API"
              title={
                isMetaLoading
                  ? "Checking Meta setup"
                  : metaStatus?.connected
                  ? "Connected through official app flow"
                  : metaStatus?.configured
                  ? "Ready for developer-mode testing"
                  : "Needs official Meta app setup"
              }
              status={metaReadyState}
            >
              <p className="text-sm text-slate-300">
                This flow follows the official Meta app path: app setup,
                redirect URI, OAuth login, ad account selection, then a live
                insights preview before the dashboard trusts any scaling logic.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MiniMetric
                  label="App Mode"
                  value={metaStatus?.appMode ?? "development"}
                  hint="Start with test people and test assets"
                  tone="warn"
                />
                <MiniMetric
                  label="Selected Account"
                  value={metaStatus?.selectedAccount?.name ?? "Not selected"}
                  hint={metaStatus?.selectedAccountId ?? "Choose a test ad account"}
                  tone={metaStatus?.selectedAccount ? "good" : "default"}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-xs font-black uppercase text-slate-400">
                  Callback URL
                </div>
                <div className="mt-2 break-all text-sm font-bold text-cyan-300">
                  {metaStatus?.callbackUrl ?? "/api/integrations/meta/callback"}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(metaStatus?.scopes ?? [
                  "ads_read",
                  "ads_management",
                  "business_management",
                ]).map((scope) => (
                  <span
                    key={scope}
                    className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs font-bold text-slate-300"
                  >
                    {scope}
                  </span>
                ))}
              </div>

              <div className="mt-4 space-y-4">
                <EnvList values={metaStatus?.missingEnv ?? []} />
                <MessageBox message={metaStatus?.connectionError ?? null} />
                <MessageBox tone="info" message={metaMessage} />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="/api/integrations/meta/connect"
                  className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  Connect Meta App
                </a>
                <button
                  type="button"
                  onClick={() => void loadMetaStatus()}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Refresh Status
                </button>
                <button
                  type="button"
                  onClick={() => void handleDisconnectMeta()}
                  className="rounded-xl border border-red-500/40 px-4 py-3 text-sm font-bold text-red-200 transition hover:border-red-400 hover:text-white"
                >
                  Disconnect
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-xs font-black uppercase text-slate-400">
                  Test Account Selection
                </div>
                <select
                  value={accountDraft}
                  onChange={(event) => setAccountDraft(event.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Select a Meta ad account</option>
                  {(metaStatus?.accounts ?? []).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.id})
                    </option>
                  ))}
                </select>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleAccountSelect()}
                    className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                  >
                    Use This Account
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleMetaPreview()}
                    className="rounded-xl border border-emerald-500/40 px-4 py-3 text-sm font-bold text-emerald-200 transition hover:border-emerald-400 hover:text-white"
                  >
                    {isMetaPreviewLoading ? "Loading Preview" : "Load Insights Preview"}
                  </button>
                </div>
              </div>
            </Surface>

            <Surface
              eyebrow="Shopify Store Truth"
              title={
                isShopifyLoading
                  ? "Checking Shopify setup"
                  : shopifyStatus?.previewReady
                  ? "Store truth preview is ready"
                  : shopifyStatus?.configured
                  ? "Ready for official Shopify testing"
                  : "Needs Shopify app credentials"
              }
              status={shopifyReadyState}
            >
              <p className="text-sm text-slate-300">
                This follows Shopify&apos;s official GraphQL Admin API path.
                For a store you control, the trusted server route is app
                credentials plus store-level permissions, then order-based
                business truth queries.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MiniMetric
                  label="Store Domain"
                  value={shopifyStatus?.storeDomain || "Not configured"}
                  hint="Official app install required"
                  tone={shopifyStatus?.storeDomain ? "good" : "default"}
                />
                <MiniMetric
                  label="API Version"
                  value={shopifyStatus?.apiVersion ?? "2026-01"}
                  hint="GraphQL Admin API"
                  tone="warn"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(shopifyStatus?.requestedScopes ?? ["read_orders"]).map((scope) => (
                  <span
                    key={scope}
                    className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs font-bold text-slate-300"
                  >
                    {scope}
                  </span>
                ))}
              </div>

              <div className="mt-4 space-y-4">
                <EnvList values={shopifyStatus?.missingEnv ?? []} />
                <MessageBox message={shopifyStatus?.connectionError ?? null} />
                <MessageBox tone="info" message={shopifyMessage} />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleShopifyConnect()}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                >
                  Connect Shopify
                </button>
                <button
                  type="button"
                  onClick={() => void loadShopifyStatus()}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Refresh Status
                </button>
                <button
                  type="button"
                  onClick={() => void handleShopifyPreview()}
                  className="rounded-xl border border-emerald-500/40 px-4 py-3 text-sm font-bold text-emerald-200 transition hover:border-emerald-400 hover:text-white"
                >
                  {isShopifyPreviewLoading
                    ? "Loading Store Truth"
                    : "Load Store-Truth Preview"}
                </button>
              </div>
            </Surface>
          </div>
        </Section>

        <Section
          title="Readiness Snapshot"
          subtitle="The dashboard should only trust scaling logic after platform data is paired with business truth."
        >
          <div className="grid gap-4 md:grid-cols-4">
            <MiniMetric
              label="Meta Status"
              value={metaStatus?.connected ? "Connected" : "Pending"}
              hint={metaStatus?.recommendedNextStep ?? "Configure the official app first"}
              tone={metaStatus?.connected ? "good" : "warn"}
            />
            <MiniMetric
              label="Shopify Status"
              value={shopifyStatus?.connected ? "Connected" : "Pending"}
              hint={
                shopifyStatus?.recommendedNextStep ??
                "Add store credentials and install the app"
              }
              tone={shopifyStatus?.connected ? "good" : "warn"}
            />
            <MiniMetric
              label="Decision Trust"
              value={
                metaStatus?.connected && shopifyStatus?.previewReady
                  ? "Pair Ready"
                  : "Blocked"
              }
              hint="Real scaling needs platform plus business-truth agreement"
              tone={
                metaStatus?.connected && shopifyStatus?.previewReady
                  ? "good"
                  : "bad"
              }
            />
            <MiniMetric
              label="Mode"
              value="Developer First"
              hint="Test users, test assets, then live review"
              tone="warn"
            />
          </div>
        </Section>

        <div className="grid gap-5 xl:grid-cols-2">
          <Section
            title="Meta Preview"
            subtitle="Pull a live sample from the selected ad account before wiring these metrics deeper into the decision engine."
          >
            {metaInsights ? (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <MiniMetric
                    label="Spend"
                    value={`$${metaInsights.totals.spend.toFixed(0)}`}
                    tone="warn"
                  />
                  <MiniMetric
                    label="Purchases"
                    value={`${metaInsights.totals.purchases}`}
                    tone="good"
                  />
                  <MiniMetric
                    label="Revenue"
                    value={`$${metaInsights.totals.purchaseValue.toFixed(0)}`}
                    tone="good"
                  />
                  <MiniMetric
                    label="Clicks"
                    value={`${metaInsights.totals.clicks}`}
                    tone="default"
                  />
                </div>

                <p className="mt-4 text-sm text-slate-400">{metaInsights.note}</p>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-xs uppercase text-slate-400">
                      <tr>
                        <th className="pb-3">Campaign</th>
                        <th>Spend</th>
                        <th>CTR</th>
                        <th>Frequency</th>
                        <th>Purchases</th>
                        <th>Purchase Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metaInsights.rows.slice(0, 8).map((row) => (
                        <tr key={row.campaignId} className="border-t border-slate-800">
                          <td className="py-4 font-semibold text-white">
                            {row.campaignName}
                          </td>
                          <td className="text-slate-300">${row.spend.toFixed(0)}</td>
                          <td className="text-slate-300">{row.ctr.toFixed(2)}%</td>
                          <td className="text-slate-300">{row.frequency.toFixed(2)}</td>
                          <td className="text-slate-300">{row.purchases}</td>
                          <td className="text-slate-300">
                            ${row.purchaseValue.toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-5 text-sm text-slate-400">
                No live Meta preview loaded yet. Connect the official app,
                choose a test account, then pull a preview before trusting any
                recommendation layer.
              </div>
            )}
          </Section>

          <Section
            title="Shopify Preview"
            subtitle="Use store truth to validate platform reporting before enabling real scale recommendations."
          >
            {shopifyPreview ? (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <MiniMetric
                    label="Gross Sales"
                    value={`${shopifyPreview.snapshot.currencyCode} ${shopifyPreview.snapshot.grossSales.toFixed(0)}`}
                    tone="good"
                  />
                  <MiniMetric
                    label="Net Sales"
                    value={`${shopifyPreview.snapshot.currencyCode} ${shopifyPreview.snapshot.netSales.toFixed(0)}`}
                    tone="good"
                  />
                  <MiniMetric
                    label="Orders"
                    value={`${shopifyPreview.snapshot.ordersCount}`}
                    tone="default"
                  />
                  <MiniMetric
                    label="AOV"
                    value={`${shopifyPreview.snapshot.currencyCode} ${shopifyPreview.snapshot.averageOrderValue.toFixed(0)}`}
                    tone="warn"
                  />
                </div>

                <p className="mt-4 text-sm text-slate-400">{shopifyPreview.note}</p>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-xs uppercase text-slate-400">
                      <tr>
                        <th className="pb-3">Order</th>
                        <th>Total</th>
                        <th>Tax</th>
                        <th>Shipping</th>
                        <th>Items</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shopifyPreview.orders.slice(0, 8).map((order) => (
                        <tr key={order.id} className="border-t border-slate-800">
                          <td className="py-4 font-semibold text-white">{order.name}</td>
                          <td className="text-slate-300">
                            {shopifyPreview.snapshot.currencyCode}{" "}
                            {order.totalPrice.toFixed(0)}
                          </td>
                          <td className="text-slate-300">
                            {shopifyPreview.snapshot.currencyCode}{" "}
                            {order.taxTotal.toFixed(0)}
                          </td>
                          <td className="text-slate-300">
                            {shopifyPreview.snapshot.currencyCode}{" "}
                            {order.shippingTotal.toFixed(0)}
                          </td>
                          <td className="text-slate-300">{order.lineItemsQuantity}</td>
                          <td className="text-slate-300">{order.financialStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-5 text-sm text-slate-400">
                No Shopify truth preview loaded yet. Once this is connected, the
                dashboard can compare real store sales and orders against Meta
                reporting instead of relying on platform attribution alone.
              </div>
            )}
          </Section>
        </div>

        <Section
          title="What Comes Next"
          subtitle="The product becomes truly testable on live accounts once the official connection layer is followed by stored facts and repeatable syncs."
        >
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex items-center gap-3 text-cyan-300">
                <Plug size={18} />
                <div className="text-sm font-black uppercase">Connections</div>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Finish official app setup in developer mode, then add the real
                Vercel environment values for Meta and Shopify.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex items-center gap-3 text-emerald-300">
                <Store size={18} />
                <div className="text-sm font-black uppercase">Truth Layer</div>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Persist daily platform facts and store facts so MER, tracking
                mismatch, and scaling decisions are based on real history.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex items-center gap-3 text-amber-300">
                <ShieldCheck size={18} />
                <div className="text-sm font-black uppercase">Validation</div>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Add scheduled syncs, then bring in Google Ads and GA4 once the
                first Meta-plus-store pairing is behaving correctly.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
            <div className="flex items-center gap-3 text-blue-300">
              <Workflow size={18} />
              <div className="text-sm font-black uppercase">Recommended Order</div>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              1. Meta app credentials and test account access. 2. Shopify store
              credentials and order preview. 3. Persistence tables plus sync
              runs. 4. Scheduled syncs. 5. Google Ads and GA4. 6. Only then turn
              on real decision scoring for live clients.
            </p>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
