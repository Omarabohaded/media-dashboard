"use client";

import { useEffect, useState } from "react";
import MetricHealthCard from "../../components/MetricHealthCard";
import { evaluateMetric } from "../../lib/healthEngine";
import { metricDictionary } from "../../lib/metricDictionary";
import { evaluateRelationships } from "../../lib/relationshipEngine";
import { prioritizeSignals } from "../../lib/priorityEngine";
import { buildDecisionFeed } from "../../lib/decisionEngine";
import { evaluateTrend } from "../../lib/trendEngine";
import { evaluateScaling } from "../../lib/scalingEngine";
import { buildMetricCards } from "../../lib/metricRenderer";
import {
  AppShell,
  MiniMetric,
  Section,
  StatusPill,
} from "../../components/AppShell";

import {
  Database,
  Globe2,
  Layers3,
  Plug,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Workflow,
} from "lucide-react";

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

const merHealth = evaluateMetric("mer", 1.8);
const metricCards = buildMetricCards([
  { id: "mer", value: 1.8 },
  { id: "ctr", value: 0.7 },
  { id: "new_customer_cac", value: 240 },
]);
const merTrend = evaluateTrend([
  2.6,
  2.8,
  3.1,
  2.9,
  3.0,
  2.7,
  2.4,
  2.1,
  1.9,
  1.8,
]);
const relationshipSignals = evaluateRelationships({
  mer: 1.8,
  ctr: 2.4,
  cvr: 0.8,
  roas: 3.2,
  ncac: 145,
  frequency: 3.1,
  spendGrowth: 24,
  revenueGrowth: 12,
  bounceRate: 61,
  checkoutCompletionRate: 33,
  backendConversions: 228,
  platformConversions: 301,
  trackingMismatch: true,
  checkoutFailure: true,
  merBelowThreshold: true,
});
const prioritizedSignals = prioritizeSignals(relationshipSignals);
const riskSignals = prioritizedSignals.filter((signal) => signal.lane === "risk");
const opportunitySignals = prioritizedSignals.filter((signal) => signal.lane === "opportunity");
const decisionFeed = buildDecisionFeed(prioritizedSignals);
const scalingDecision = evaluateScaling({
  merStatus: merHealth.status,
  merTrend: merTrend.status,
  hasCreativeFatigue: prioritizedSignals.some(
    (signal) => signal.title.toLowerCase().includes("creative fatigue")
  ),
  revenueGrowth: 12,
  spendGrowth: 24,
  priorityScore: prioritizedSignals[0]?.score || 0,
  trackingMismatch: prioritizedSignals.some((signal) => signal.id === "tracking_mismatch"),
  businessTruthFailure: prioritizedSignals.some((signal) => signal.id === "sales_up_mer_down"),
  checkoutFailure: prioritizedSignals.some((signal) => signal.id === "checkout_failure"),
  trafficQualityIssue: prioritizedSignals.some((signal) => signal.id === "traffic_quality_issue"),
});

const clientSetup = {
  clientName: "Unresolved Crime",
  phase: "One-client MVP",
  primaryGoal: metricDictionary.priorities[0],
  secondaryGoal: metricDictionary.priorities[1],
  thirdGoal: metricDictionary.priorities[2],
  mainOperator: "Performance Marketer / Scaler",
};

const sources = [
  {
    source: "Client Website",
    type: "Business Truth",
    status: "Planned",
    owns: ["Store Sales", "Orders", "AOV", "Purchase CVR", "Sessions", "Funnel Events"],
    options: "Shopify / WooCommerce / WordPress / Google Sheet",
    note: "Store Sales should include product sales, VAT if any, and shipping when available.",
  },
  {
    source: "Meta Ads",
    type: "Platform Truth",
    status: "Planned",
    owns: ["Spend", "Impressions", "Reach", "Clicks", "CTR", "CPC", "CPM", "Frequency", "Platform ROAS"],
    options: "Meta Marketing API",
    note: "Used for media buying diagnosis, not final business truth.",
  },
  {
    source: "Google Ads",
    type: "Platform Truth",
    status: "Planned",
    owns: ["Spend", "Clicks", "CTR", "CPC", "Search Terms", "Campaign ROAS", "CPA"],
    options: "Google Ads API",
    note: "Useful for search intent, brand overlap, and conversion efficiency diagnosis.",
  },
  {
    source: "TikTok Ads",
    type: "Platform Truth",
    status: "Planned",
    owns: ["Spend", "Impressions", "Clicks", "CTR", "CPC", "CPM", "Creative Metrics", "Platform ROAS"],
    options: "TikTok Ads API",
    note: "Useful for creative testing and top-of-funnel scaling signals.",
  },
  {
    source: "Snapchat Ads",
    type: "Platform Truth",
    status: "Planned",
    owns: ["Spend", "Impressions", "Swipe Ups", "CTR", "CPC", "CPM", "Platform ROAS"],
    options: "Snap Marketing API",
    note: "Support channel unless MER and CPA prove scaling potential.",
  },
  {
    source: "Google Analytics / GA4",
    type: "Analytics Truth",
    status: "Optional",
    owns: ["Sessions", "Landing Page Views", "Source / Medium", "Engagement", "Events"],
    options: "GA4 API",
    note: "Useful for diagnosing tracking gaps and traffic quality.",
  },
];

const metricMapping = [
  {
    metric: "Store Sales",
    source: "Client Website",
    truthLayer: "Business Truth",
    formula: "Product Sales + VAT + Shipping",
    dashboardUse: "Main sales truth. Used to calculate MER.",
    priority: "Core",
  },
  {
    metric: "MER",
    source: "Calculated",
    truthLayer: "Business Truth",
    formula: "Store Sales / Total Ad Spend",
    dashboardUse: "Master KPI for safe scaling.",
    priority: "Core",
  },
  {
    metric: "Total Ad Spend",
    source: "All Ad Platforms",
    truthLayer: "Platform Truth",
    formula: "Meta Spend + Google Spend + TikTok Spend + Snap Spend",
    dashboardUse: "Used to evaluate scaling pressure.",
    priority: "Core",
  },
  {
    metric: "CPA / CAC",
    source: "Calculated",
    truthLayer: "Mixed",
    formula: "Total Ad Spend / Orders",
    dashboardUse: "Main acquisition cost signal.",
    priority: "Core",
  },
  {
    metric: "Platform ROAS",
    source: "Ad Platforms",
    truthLayer: "Platform Attribution",
    formula: "Attributed Revenue / Platform Spend",
    dashboardUse: "Diagnostic only, not final truth.",
    priority: "Important",
  },
  {
    metric: "Purchase CVR",
    source: "Client Website / GA4",
    truthLayer: "Business / Analytics Truth",
    formula: "Orders / Sessions",
    dashboardUse: "Determines whether traffic or website is the issue.",
    priority: "Core",
  },
  {
    metric: "Creative Fatigue",
    source: "Calculated",
    truthLayer: "Signal",
    formula: "Frequency rising + CTR falling + CPA rising",
    dashboardUse: "Tells operator when to refresh creative.",
    priority: "Advanced",
  },
  {
    metric: "Scale Recommendation",
    source: "Calculated",
    truthLayer: "Signal",
    formula: "MER status + CPA status + CVR status + platform benchmark",
    dashboardUse: "Determines Scale / Hold / Fix.",
    priority: "Advanced",
  },
];

const benchmarks = [
  {
    rule: "Safe Scale",
    condition: "MER >= benchmark AND CPA <= benchmark AND sales growing",
    output: "Scale",
    action: "Increase budget gradually by 10-15%",
  },
  {
    rule: "MER Pressure",
    condition: "Store Sales up BUT MER down",
    output: "Watch / Fix",
    action: "Audit spend increase, weak platforms, and funnel conversion.",
  },
  {
    rule: "CPA Warning",
    condition: "CPA above benchmark for 2 periods",
    output: "Fix",
    action: "Reduce weak campaigns or improve conversion path.",
  },
  {
    rule: "Creative Fatigue",
    condition: "Frequency rising AND CTR falling",
    output: "Watch",
    action: "Refresh hooks, angles, and winning creative formats.",
  },
  {
    rule: "Funnel Bottleneck",
    condition: "Sessions stable/up BUT ATC or Checkout down",
    output: "Fix",
    action: "Check product page, offer, checkout, pricing, and traffic quality.",
  },
  {
    rule: "Tracking Gap",
    condition: "Platform ROAS strong BUT MER weak",
    output: "Investigate",
    action: "Compare platform attribution with store sales truth.",
  },
];

function AdminCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-blue-600/20 p-2 text-blue-300">
          <Icon size={20} />
        </div>
        <h4 className="text-lg font-black text-white">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export default function AdminPage() {
  const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null);
  const [metaInsights, setMetaInsights] = useState<MetaInsightsPreview | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [accountDraft, setAccountDraft] = useState("");
  const [metaMessage, setMetaMessage] = useState<string | null>(null);

  async function loadMetaStatus() {
    setIsStatusLoading(true);

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
      setIsStatusLoading(false);
    }
  }

  useEffect(() => {
    void loadMetaStatus();
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

  async function handleInsightsPreview() {
    setMetaMessage(null);
    setIsInsightsLoading(true);

    try {
      const response = await fetch("/api/integrations/meta/insights-preview", {
        cache: "no-store",
      });
      const payload = (await response.json()) as MetaInsightsPreview & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load Meta insights preview.");
      }

      setMetaInsights(payload);
    } catch (error) {
      setMetaMessage(
        error instanceof Error ? error.message : "Could not load Meta preview."
      );
    } finally {
      setIsInsightsLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <Section
          title="Official API Onboarding"
          subtitle="Use the official Meta app flow in developer mode first, then expand to other platforms using the same pattern."
        >
          <div className="grid gap-5 xl:grid-cols-[1.25fr,0.75fr]">
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold uppercase text-cyan-300">
                    Meta Marketing API
                  </div>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    {isStatusLoading
                      ? "Checking connection status"
                      : metaStatus?.connected
                      ? "Connected through official app flow"
                      : metaStatus?.configured
                      ? "Ready to connect in developer mode"
                      : "Needs official app configuration"}
                  </h3>
                </div>
                <StatusPill
                  status={
                    metaStatus?.connected
                      ? "Good"
                      : metaStatus?.configured
                      ? "Watch"
                      : "Fix"
                  }
                />
              </div>

              <p className="mt-3 text-sm text-slate-300">
                This uses Meta&apos;s official app-developer flow: app setup, approved
                redirect URI, OAuth login, ad-account selection, then a live insights
                preview before any decision logic is trusted.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="text-xs font-black uppercase text-slate-400">
                    App Mode
                  </div>
                  <div className="mt-2 text-lg font-bold text-white">
                    {metaStatus?.appMode ?? "development"}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Start in developer mode with test users and test ad accounts, then move
                    to live mode after review and validation.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="text-xs font-black uppercase text-slate-400">
                    Callback URL
                  </div>
                  <div className="mt-2 break-all text-sm font-bold text-cyan-300">
                    {metaStatus?.callbackUrl ?? "/api/integrations/meta/callback"}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Add this exact URL to your Meta app&apos;s valid OAuth redirect list.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
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

              {metaStatus?.missingEnv?.length ? (
                <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/20 p-4">
                  <div className="text-sm font-bold uppercase text-red-300">
                    Missing Environment Values
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {metaStatus.missingEnv.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-red-950/70 px-3 py-1 text-xs font-bold text-red-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {metaStatus?.connectionError ? (
                <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-200">
                  {metaStatus.connectionError}
                </div>
              ) : null}

              {metaMessage ? (
                <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-200">
                  {metaMessage}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
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
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="text-sm font-bold uppercase text-slate-400">
                Recommended Sequence
              </div>
              <div className="mt-4 space-y-4 text-sm text-slate-300">
                <div>
                  <div className="font-bold text-white">1. Meta App Setup</div>
                  <div className="mt-1">Create the app, set the redirect URI, and keep it in developer mode first.</div>
                </div>
                <div>
                  <div className="font-bold text-white">2. Real Account Test</div>
                  <div className="mt-1">Connect a real user with access to the test ad account and preview insights before syncing wider data.</div>
                </div>
                <div>
                  <div className="font-bold text-white">3. Store Truth Pairing</div>
                  <div className="mt-1">Only trust scale recommendations after Meta numbers are compared against the website or store source.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr,1.15fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-600/20 p-2 text-emerald-300">
                  <Workflow size={20} />
                </div>
                <h4 className="text-lg font-black text-white">Meta Test Account Selection</h4>
              </div>

              <p className="mt-3 text-sm text-slate-400">
                In developer mode, Meta only allows app admins, developers, testers, and
                assets they can access. Pick the exact ad account you want this dashboard to test.
              </p>

              <select
                value={accountDraft}
                onChange={(event) => setAccountDraft(event.target.value)}
                className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">Select a Meta ad account</option>
                {(metaStatus?.accounts ?? []).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.id})
                  </option>
                ))}
              </select>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleAccountSelect()}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                >
                  Use This Account
                </button>
                <button
                  type="button"
                  onClick={() => void handleInsightsPreview()}
                  className="rounded-xl border border-cyan-500/40 px-4 py-3 text-sm font-bold text-cyan-200 transition hover:border-cyan-400 hover:text-white"
                >
                  {isInsightsLoading ? "Loading Preview" : "Load Insights Preview"}
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="text-xs font-black uppercase text-slate-400">
                  Next Step
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {metaStatus?.recommendedNextStep ??
                    "Configure the Meta app env values, then connect through the official flow."}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold uppercase text-slate-400">
                    Live Meta Preview
                  </div>
                  <h4 className="mt-2 text-lg font-black text-white">
                    Campaign-level insights for the last 7 days
                  </h4>
                </div>
                <StatusPill
                  status={metaInsights?.rows?.length ? "Good" : metaStatus?.syncReady ? "Watch" : "Fix"}
                />
              </div>

              {metaInsights ? (
                <>
                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <MiniMetric label="Spend" value={`$${metaInsights.totals.spend.toFixed(0)}`} tone="warn" />
                    <MiniMetric label="Purchases" value={`${metaInsights.totals.purchases}`} tone="good" />
                    <MiniMetric label="Purchase Value" value={`$${metaInsights.totals.purchaseValue.toFixed(0)}`} tone="good" />
                    <MiniMetric label="Clicks" value={`${metaInsights.totals.clicks}`} tone="default" />
                  </div>

                  <p className="mt-4 text-sm text-slate-400">{metaInsights.note}</p>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
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
                            <td className="py-4 font-semibold text-white">{row.campaignName}</td>
                            <td className="text-slate-300">${row.spend.toFixed(0)}</td>
                            <td className="text-slate-300">{row.ctr.toFixed(2)}%</td>
                            <td className="text-slate-300">{row.frequency.toFixed(2)}</td>
                            <td className="text-slate-300">{row.purchases}</td>
                            <td className="text-slate-300">${row.purchaseValue.toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-5 text-sm text-slate-400">
                  No live Meta preview loaded yet. Connect the app, choose an account, then pull a preview before wiring this into the dashboard metrics.
                </div>
              )}
            </div>
          </div>
        </Section>
        <Section
  title="Admin Panel Foundation"
  subtitle="This is where the dashboard will eventually be configured. It now includes the first official Meta onboarding scaffold alongside the mock mapping layer."
>
  <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-950/30 p-5">
    <div className="text-sm font-bold uppercase text-blue-300">
      Operator Decision Feed
    </div>

    <h3 className="mt-2 text-2xl font-black text-white">
      {decisionFeed.headline}
    </h3>

    <p className="mt-3 text-sm text-slate-300">
      {decisionFeed.summary}
    </p>

    <div className="mt-4 rounded-xl bg-slate-950/60 p-3 text-sm font-bold text-cyan-300">
      Action: {decisionFeed.primaryAction}
    </div>
  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-3">
    <div className="mb-6 rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5">
  <div className="text-sm font-bold uppercase text-purple-300">
    Scaling Confidence
  </div>

  <h3 className="mt-2 text-2xl font-black text-white">
    {scalingDecision.status.toUpperCase()} · {scalingDecision.confidence}%
  </h3>

  <p className="mt-3 text-sm text-slate-300">
    {scalingDecision.summary}
  </p>

  <div className="mt-4 rounded-xl bg-slate-950/60 p-3 text-sm font-bold text-cyan-300">
    Action: {scalingDecision.recommendation}
  </div>
</div>
  {metricCards.map((metric) => (
  <MetricHealthCard
    key={metric.metricId}
    label={metric.label}
    value={metric.value}
    status={metric.status}
    interpretation={metric.healthySignal}
    action={metric.action}
    benchmarks={metric.benchmarks}
  />
))}
</div>
<div className="mt-6 grid gap-6 xl:grid-cols-2">
  <div>
    <div className="mb-3 text-sm font-bold uppercase text-red-300">
      Risk Lane
    </div>
    <div className="grid gap-4">
  {riskSignals.map((signal) => (
  <div
    key={signal.id}
    className={`rounded-2xl border p-5 ${
      signal.priorityLabel === "Critical"
        ? "border-red-500 bg-red-950/20"
        : signal.priorityLabel === "High"
        ? "border-orange-500 bg-orange-950/20"
        : signal.priorityLabel === "Medium"
        ? "border-yellow-500 bg-yellow-950/20"
        : "border-slate-700 bg-slate-950/40"
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {signal.priorityLabel}
      </div>

      <div className="rounded-full bg-slate-900 px-3 py-1 text-sm font-bold text-cyan-300">
        Score {signal.score}
      </div>
    </div>

    <div className="mt-3 text-xl font-bold text-white">
      {signal.title}
    </div>

    <div className="mt-3 text-sm text-slate-300">
      {signal.diagnosis}
    </div>

    <div className="mt-4 rounded-xl bg-slate-950/70 p-3 text-sm text-cyan-300">
      Action: {signal.recommendation}
    </div>
  </div>
))}
    </div>
  </div>
  <div>
    <div className="mb-3 text-sm font-bold uppercase text-emerald-300">
      Opportunity Lane
    </div>
    <div className="grid gap-4">
      {opportunitySignals.length ? opportunitySignals.map((signal) => (
        <div
          key={signal.id}
          className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-emerald-300">
              {signal.priorityLabel}
            </div>

            <div className="rounded-full bg-slate-900 px-3 py-1 text-sm font-bold text-cyan-300">
              Score {signal.score}
            </div>
          </div>

          <div className="mt-3 text-xl font-bold text-white">
            {signal.title}
          </div>

          <div className="mt-3 text-sm text-slate-300">
            {signal.diagnosis}
          </div>

          <div className="mt-4 rounded-xl bg-slate-950/70 p-3 text-sm text-cyan-300">
            Action: {signal.recommendation}
          </div>
        </div>
      )) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 text-sm text-slate-300">
          Opportunities stay suppressed while higher-priority business risks are active on the same account.
        </div>
      )}
    </div>
  </div>
</div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric label="Client" value={clientSetup.clientName} hint={clientSetup.phase} tone="good" />
            <MiniMetric label="Primary Goal" value="Scale Safely" hint="Performance marketer / scaler first" tone="good" />
            <MiniMetric label="Business Truth" value="Store Sales" hint="Sales + VAT + Shipping" tone="good" />
            <MiniMetric label="Dashboard Mode" value="Daily First" hint="Reporting is secondary" tone="warn" />
          </div>
        </Section>

        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="Client Setup" subtitle="The setup profile for this one-client MVP.">
            <div className="grid gap-4 md:grid-cols-2">
              <AdminCard icon={Store} title="Client Identity">
                <div className="space-y-2 text-sm text-slate-300">
                  <p><span className="text-slate-500">Client:</span> {clientSetup.clientName}</p>
                  <p><span className="text-slate-500">Phase:</span> {clientSetup.phase}</p>
                  <p><span className="text-slate-500">Main User:</span> {clientSetup.mainOperator}</p>
                </div>
              </AdminCard>
              <AdminCard icon={ShieldCheck} title="Operating Goals">
                <div className="space-y-2 text-sm text-slate-300">
                  <p>1. {clientSetup.primaryGoal}</p>
                  <p>2. {clientSetup.secondaryGoal}</p>
                  <p>3. {clientSetup.thirdGoal}</p>
                </div>
              </AdminCard>
            </div>
          </Section>

          <Section title="Truth Layer Rules" subtitle="How the dashboard should interpret numbers.">
            <div className="grid gap-4 md:grid-cols-2">
              <AdminCard icon={Globe2} title="Business Truth">
                <p className="text-sm leading-6 text-slate-300">
                  Store Sales is the main business truth. It should come from the client website/store and include sales, VAT if any, and shipping when available.
                </p>
              </AdminCard>
              <AdminCard icon={Database} title="Platform Truth">
                <p className="text-sm leading-6 text-slate-300">
                  Platform ROAS is used for diagnosis only. It helps explain performance but should not replace MER or Store Sales.
                </p>
              </AdminCard>
            </div>
          </Section>
        </div>

        <Section title="Source Mapping" subtitle="Which source owns which data. Later this becomes editable.">
          <div className="grid gap-4 xl:grid-cols-2">
            {sources.map((source) => (
              <div key={source.source} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xl font-black text-white">{source.source}</h4>
                    <p className="text-sm text-slate-400">{source.type}</p>
                  </div>
                  <StatusPill status={source.status === "Planned" ? "Watch" : source.status === "Optional" ? "Stable" : "Good"} />
                </div>
                <p className="mb-3 text-sm text-slate-400">{source.note}</p>
                <p className="mb-2 text-xs font-black uppercase text-slate-500">Owns</p>
                <div className="flex flex-wrap gap-2">
                  {source.owns.map((item) => (
                    <span key={item} className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs text-blue-300">Connection options: {source.options}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Metric Mapping" subtitle="This is the dashboard dictionary that tells the app what every metric means and where it comes from.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="pb-3">Metric</th>
                  <th>Source</th>
                  <th>Truth Layer</th>
                  <th>Formula</th>
                  <th>Dashboard Use</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {metricMapping.map((row) => (
                  <tr key={row.metric} className="border-t border-slate-800">
                    <td className="py-4 font-black text-white">{row.metric}</td>
                    <td>{row.source}</td>
                    <td>{row.truthLayer}</td>
                    <td className="text-slate-300">{row.formula}</td>
                    <td className="text-slate-300">{row.dashboardUse}</td>
                    <td>
                      <span className={`rounded-lg px-3 py-1 text-xs font-black ${
                        row.priority === "Core"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : row.priority === "Advanced"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-blue-500/20 text-blue-300"
                      }`}>
                        {row.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Benchmark Rules" subtitle="The first version of the decision engine. Later each rule becomes configurable per client.">
          <div className="grid gap-4 xl:grid-cols-2">
            {benchmarks.map((rule) => (
              <div key={rule.rule} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-purple-600/20 p-2 text-purple-300">
                    <SlidersHorizontal size={20} />
                  </div>
                  <h4 className="text-xl font-black">{rule.rule}</h4>
                </div>
                <p className="text-sm text-slate-400"><span className="font-bold text-slate-300">Condition:</span> {rule.condition}</p>
                <p className="mt-2 text-sm text-slate-400"><span className="font-bold text-slate-300">Output:</span> {rule.output}</p>
                <p className="mt-3 rounded-xl bg-slate-900 p-3 text-sm font-bold text-white">Action: {rule.action}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Next Admin Features" subtitle="What this page will become later.">
          <div className="grid gap-5 md:grid-cols-3">
            <AdminCard icon={Plug} title="Connect Sources">
              <p className="text-sm leading-6 text-slate-300">
                Add Meta, Google, TikTok, Snap, Shopify, WooCommerce, GA4, or Google Sheets connections.
              </p>
            </AdminCard>
            <AdminCard icon={Layers3} title="Map Metrics">
              <p className="text-sm leading-6 text-slate-300">
                Select which source field powers each dashboard metric for each client.
              </p>
            </AdminCard>
            <AdminCard icon={Settings} title="Set Rules">
              <p className="text-sm leading-6 text-slate-300">
                Define benchmarks, thresholds, warning rules, and safe scaling limits.
              </p>
            </AdminCard>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
