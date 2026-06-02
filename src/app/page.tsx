"use client";

import Link from "next/link";
import {
  AppShell,
  DashboardLoadingState,
  EmptySectionState,
  MiniMetric,
  PageLead,
  Section,
  SourcePill,
  StatusPill,
} from "@/components/AppShell";
import {
  getEffectiveAov,
  getEffectiveBlendedRoas,
  getEffectiveCtr,
  getEffectiveMer,
  getEffectiveOrders,
  getEffectiveStoreRevenue,
  getRevenueBasisLabel,
} from "@/lib/dashboardMetricLogic";
import { getFunnelReadiness } from "@/lib/funnelReadiness";
import { useDashboardReadiness } from "@/lib/useDashboardReadiness";
import { evaluateTrackingGap } from "@/lib/workbookSignals";

function formatMoney(value: number, currencyCode: string, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatPercent(value: number, digits = 1) {
  return `${formatNumber(value, digits)}%`;
}

type CommandSignal = {
  title: string;
  detail: string;
  status: string;
};

type CampaignRow = {
  campaignId: string;
  campaignName: string;
  spend: number;
  ctr: number;
  cpc?: number;
  cpm?: number;
  frequency: number;
  reach?: number;
  purchases: number;
  purchaseValue: number;
  addToCart?: number;
  checkoutInitiated?: number;
};

export default function DashboardPage() {
  const {
    activeClient,
    isLoading,
    message,
    metaPreview,
    metaStatus,
    storePreview,
    storeStatus,
    metricLogic,
  } = useDashboardReadiness();

  const hasMeta = Boolean(metaPreview && metaStatus?.selectedAccountId);
  const hasStoreTruth = Boolean(storePreview);
  const storeCurrency = storePreview?.currencyCode ?? activeClient?.currencyCode ?? "USD";
  const adCurrency = metaStatus?.selectedAccount?.currency ?? storeCurrency;
  const spend = metaPreview?.totals.spend ?? 0;
  const revenue = getEffectiveStoreRevenue(storePreview, metricLogic);
  const orders = getEffectiveOrders(storePreview, metricLogic);
  const mer = getEffectiveMer(storePreview, metaPreview, metricLogic);
  const blendedRoas = getEffectiveBlendedRoas(metaPreview, metricLogic);
  const aov = getEffectiveAov(storePreview, metricLogic);
  const clicks = metaPreview?.totals.clicks ?? 0;
  const platformPurchases = metaPreview?.totals.purchases ?? 0;
  const impressions = metaPreview?.totals.impressions ?? 0;
  const purchaseProxyCvr = hasMeta && clicks > 0 ? (platformPurchases / clicks) * 100 : null;
  const trafficCtr = getEffectiveCtr(metaPreview, metricLogic);
  const trackingGap = evaluateTrackingGap({
    storeRevenue: hasStoreTruth ? revenue : undefined,
    platformRevenue: hasMeta ? metaPreview?.totals.purchaseValue : undefined,
    storeOrders: hasStoreTruth ? orders : undefined,
    platformPurchases: hasMeta ? platformPurchases : undefined,
  });
  const funnelReadiness = getFunnelReadiness({
    storePreview,
    metaPreview,
    analyticsConnected: false,
  });
  const blockedFunnelMetrics = funnelReadiness.filter(
    (metric) => metric.state === "blocked"
  ).length;

  const campaignRows = [...(metaPreview?.rows ?? [])].sort((a, b) => b.spend - a.spend);
  const topCampaigns = campaignRows.slice(0, 5);
  const averageFrequency = campaignRows.length
    ? campaignRows.reduce((sum, row) => sum + (row.frequency || 0), 0) / campaignRows.length
    : null;
  const totalAddToCart = campaignRows.reduce(
    (sum, row) => sum + (row.addToCart ?? 0),
    0
  );
  const totalCheckout = campaignRows.reduce(
    (sum, row) => sum + (row.checkoutInitiated ?? 0),
    0
  );
  const storeRevenueBasis = getRevenueBasisLabel(metricLogic.storeRevenueBasis);
  const merBasis = getRevenueBasisLabel(metricLogic.merRevenueBasis);
  const aovBasis = getRevenueBasisLabel(metricLogic.aovRevenueBasis);

  const executiveSummary =
    hasStoreTruth && hasMeta
      ? mer !== null && mer >= 2
        ? "Store truth and paid-media truth are both connected, so this page can now act like a real operating surface instead of a setup screen."
        : "The dashboard is live and readable, but the current business-efficiency read needs deeper diagnosis across traffic quality, funnel friction, or attribution trust."
      : "The dashboard shell is live, and it stays explicit about which truth layers are connected before it pretends a number is ready for decision-making.";

  const risks: CommandSignal[] = [];
  const opportunities: CommandSignal[] = [];

  if (!hasStoreTruth) {
    risks.push({
      title: "Store truth is still missing.",
      detail:
        storeStatus?.recommendedNextStep ??
        "Connect the store source before using revenue and order metrics as business truth.",
      status: "Blocked",
    });
  }

  if (!hasMeta) {
    risks.push({
      title: "Paid-media live preview is not ready.",
      detail:
        metaStatus?.connectionError ??
        "Connect a paid-media account and save the selected ad account in Admin.",
      status: "Blocked",
    });
  }

  if (trackingGap.ready && trackingGap.active) {
    risks.push({
      title: "Platform revenue and store revenue are diverging.",
      detail: trackingGap.summary,
      status: "Review",
    });
  }

  if (averageFrequency !== null && averageFrequency >= 4) {
    risks.push({
      title: "Average frequency is high enough to watch for fatigue.",
      detail: `Campaign-weighted frequency is currently ${formatNumber(averageFrequency, 1)}.`,
      status: "Watch",
    });
  }

  if (blockedFunnelMetrics > 0) {
    risks.push({
      title: "Full funnel truth is still incomplete.",
      detail: `${blockedFunnelMetrics} funnel metrics are still blocked until site analytics is connected.`,
      status: "Partial",
    });
  }

  if (mer !== null && mer >= 2) {
    opportunities.push({
      title: "Business efficiency is currently in a workable range.",
      detail: `MER is ${formatNumber(mer, 2)}x using ${merBasis.toLowerCase()} against live ad spend.`,
      status: "Stable",
    });
  }

  if (blendedRoas !== null && blendedRoas >= 2) {
    opportunities.push({
      title: "Attributed return is supporting the current spend level.",
      detail: `Blended ROAS is ${formatNumber(blendedRoas, 2)}x from connected platform revenue.`,
      status: "Good",
    });
  }

  if (topCampaigns[0]) {
    const top = topCampaigns[0];
    const topRoas = top.spend > 0 ? top.purchaseValue / top.spend : null;
    opportunities.push({
      title: `${top.campaignName} is the current spend leader.`,
      detail:
        topRoas !== null
          ? `It has ${formatMoney(top.spend, adCurrency)} in spend with ${formatNumber(topRoas, 2)}x attributed ROAS.`
          : `It currently leads spend at ${formatMoney(top.spend, adCurrency)}.`,
      status: "Scale",
    });
  }

  if (aov !== null) {
    opportunities.push({
      title: "Order quality is readable from store truth.",
      detail: `AOV is ${formatMoney(aov, storeCurrency, 2)} using ${aovBasis.toLowerCase()}.`,
      status: "Ready",
    });
  }

  if (!risks.length) {
    risks.push({
      title: "No major blocking risks are active from the connected sources.",
      detail: "Keep monitoring tracking trust, funnel completeness, and frequency as spend scales.",
      status: "Healthy",
    });
  }

  if (!opportunities.length) {
    opportunities.push({
      title: "The clearest next opportunity is data completion.",
      detail: "As more truth layers connect, the dashboard can move from setup visibility into stronger action ranking.",
      status: "Next",
    });
  }

  if (isLoading) {
    return (
      <AppShell>
        <DashboardLoadingState
          title="Loading live command center"
          description="Pulling the active client, source status, paid-media preview, and storefront truth now."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageLead
          eyebrow="Command Center"
          title={
            activeClient
              ? `${activeClient.name} performance marketing command center`
              : "Performance marketing command center"
          }
          summary={executiveSummary}
        />

        <div className="flex flex-wrap gap-2">
          <SourcePill
            label={hasStoreTruth ? "Store truth connected" : "Store truth missing"}
            tone={hasStoreTruth ? "good" : "warn"}
          />
          <SourcePill
            label={hasMeta ? "Paid media connected" : "Paid media missing"}
            tone={hasMeta ? "good" : "warn"}
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
          <SourcePill
            label={
              blockedFunnelMetrics > 0
                ? `${blockedFunnelMetrics} funnel metrics blocked`
                : "Funnel truth readable"
            }
            tone={blockedFunnelMetrics > 0 ? "warn" : "good"}
          />
        </div>

        {!hasStoreTruth && !hasMeta ? (
          <EmptySectionState
            title="The dashboard route is live, but the core truth layers are still missing"
            description="This page is now the real homepage of your dashboard. It will keep showing explicit readiness states until store truth and at least one paid-media source are connected."
            bullets={[
              `Active client: ${activeClient?.name ?? "No client selected"}`,
              storeStatus?.recommendedNextStep ?? "Connect Shopify or WordPress / WooCommerce first.",
              metaStatus?.connectionError ?? "Then connect Meta and save the correct ad account in Admin.",
              message ?? "Once those sources are live, this page will read as a real operating surface rather than a setup checkpoint.",
            ]}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MiniMetric
            label="Store Revenue"
            value={hasStoreTruth ? formatMoney(revenue, storeCurrency) : "Waiting"}
            hint={hasStoreTruth ? `${storeRevenueBasis} business truth` : "Business truth"}
            tone={hasStoreTruth ? "good" : "warn"}
          />
          <MiniMetric
            label="Orders"
            value={hasStoreTruth ? formatNumber(orders) : "Waiting"}
            hint="Resolved website orders"
            tone={hasStoreTruth ? "good" : "warn"}
          />
          <MiniMetric
            label="Ad Spend"
            value={hasMeta ? formatMoney(spend, adCurrency) : "Waiting"}
            hint="Connected paid-media spend"
            tone={hasMeta ? "good" : "warn"}
          />
          <MiniMetric
            label="MER"
            value={mer !== null ? `${formatNumber(mer, 2)}x` : "Waiting"}
            hint={`${merBasis} divided by ad spend`}
            tone={mer !== null ? (mer >= 2 ? "good" : "warn") : "warn"}
          />
          <MiniMetric
            label="Blended ROAS"
            value={blendedRoas !== null ? `${formatNumber(blendedRoas, 2)}x` : "Waiting"}
            hint="Resolved attributed revenue divided by spend"
            tone={blendedRoas !== null ? (blendedRoas >= 2 ? "good" : "warn") : "warn"}
          />
          <MiniMetric
            label="AOV"
            value={aov !== null ? formatMoney(aov, storeCurrency, 2) : "Waiting"}
            hint={`${aovBasis} divided by orders`}
            tone={aov !== null ? "good" : "warn"}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr,1.15fr,0.7fr]">
          <Section title="Top Risks" subtitle="What looks fragile from the connected truth layers right now.">
            <div className="space-y-3">
              {risks.slice(0, 3).map((signal) => (
                <SignalCard key={signal.title} signal={signal} />
              ))}
            </div>
          </Section>

          <Section title="Top Opportunities" subtitle="The best current reads without overclaiming beyond live data.">
            <div className="space-y-3">
              {opportunities.slice(0, 3).map((signal) => (
                <SignalCard key={signal.title} signal={signal} />
              ))}
            </div>
          </Section>

          <Section title="Operator Status" subtitle="Connection health for the real dashboard inputs.">
            <div className="grid gap-3">
              <OperatorRow
                label="Storefront"
                value={storeStatus?.sourceLabel ?? "Waiting"}
                status={hasStoreTruth ? "Connected" : storeStatus?.clientDeclinedAccess ? "Declined" : "Blocked"}
              />
              <OperatorRow
                label="Meta account"
                value={metaStatus?.selectedAccount?.name ?? "Waiting"}
                status={hasMeta ? "Live" : "Blocked"}
              />
              <OperatorRow
                label="Reporting window"
                value="Header control"
                status="Live"
              />
              <OperatorRow
                label="Metric logic"
                value="Admin mapping resolver"
                status="Connected"
              />
            </div>
          </Section>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
          <Section
            title="Campaign Read"
            subtitle="Top campaigns by spend from the connected paid-media preview."
          >
            {topCampaigns.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      <th className="pb-1 pr-4">Campaign</th>
                      <th className="pb-1 pr-4">Spend</th>
                      <th className="pb-1 pr-4">CTR</th>
                      <th className="pb-1 pr-4">Purchases</th>
                      <th className="pb-1 pr-4">ROAS</th>
                      <th className="pb-1">Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCampaigns.map((row) => {
                      const roas = row.spend > 0 ? row.purchaseValue / row.spend : null;
                      return (
                        <tr key={row.campaignId} className="rounded-[18px] bg-[rgba(255,255,255,0.62)]">
                          <td className="rounded-l-[18px] px-4 py-4 text-sm font-semibold text-[var(--ink)]">
                            {row.campaignName}
                          </td>
                          <td className="px-4 py-4 text-sm text-[var(--muted)]">
                            {formatMoney(row.spend, adCurrency)}
                          </td>
                          <td className="px-4 py-4 text-sm text-[var(--muted)]">
                            {formatPercent(row.ctr, 1)}
                          </td>
                          <td className="px-4 py-4 text-sm text-[var(--muted)]">
                            {formatNumber(row.purchases)}
                          </td>
                          <td className="px-4 py-4 text-sm text-[var(--muted)]">
                            {roas !== null ? `${formatNumber(roas, 2)}x` : "-"}
                          </td>
                          <td className="rounded-r-[18px] px-4 py-4 text-sm text-[var(--muted)]">
                            {formatNumber(row.frequency ?? 0, 1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptySectionState
                title="Campaign-level paid-media read is not ready yet"
                description="Once a live paid-media preview is connected, this table will rank the current spend leaders and their efficiency signals."
              />
            )}
          </Section>

          <Section
            title="Funnel Proxy"
            subtitle="Platform-side proxy only. Session-based funnel truth still depends on site analytics."
          >
            <div className="grid gap-3">
              <ProxyMetric
                label="Clicks"
                value={hasMeta ? formatNumber(clicks) : "Waiting"}
                hint={trafficCtr !== null ? `${formatPercent(trafficCtr, 1)} CTR` : "Traffic proxy"}
              />
              <ProxyMetric
                label="Add to cart"
                value={hasMeta ? formatNumber(totalAddToCart) : "Waiting"}
                hint="Platform-reported action volume"
              />
              <ProxyMetric
                label="Begin checkout"
                value={hasMeta ? formatNumber(totalCheckout) : "Waiting"}
                hint="Platform-reported checkout start"
              />
              <ProxyMetric
                label="Purchases"
                value={hasMeta ? formatNumber(platformPurchases) : "Waiting"}
                hint={purchaseProxyCvr !== null ? `${formatPercent(purchaseProxyCvr, 1)} click-to-purchase` : "Purchase proxy"}
              />
            </div>
          </Section>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr,1.1fr]">
          <Section
            title="Business Truth Rules"
            subtitle="The homepage now shows which revenue basis is actually driving the core metrics."
          >
            <div className="grid gap-3">
              <LogicRow
                metric="Store revenue"
                logic={`${storeRevenueBasis} from storefront truth`}
              />
              <LogicRow
                metric="MER"
                logic={`${merBasis} divided by total ad spend`}
              />
              <LogicRow
                metric="AOV"
                logic={`${aovBasis} divided by orders`}
              />
              <LogicRow
                metric="Blended ROAS"
                logic="Resolved platform value divided by spend"
              />
            </div>
          </Section>

          <Section
            title="Go Deeper"
            subtitle="Each tab keeps its own job instead of repeating the homepage."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <QuickLinkCard
                href="/health"
                title="Business Health"
                detail="Store truth, blended efficiency, and tracking trust."
              />
              <QuickLinkCard
                href="/funnel"
                title="Funnel"
                detail="Site conversion steps, blocked metrics, and drop-off reads."
              />
              <QuickLinkCard
                href="/paid-media"
                title="Paid Media"
                detail="Campaign delivery, cost efficiency, and budget allocation."
              />
              <QuickLinkCard
                href="/scaling"
                title="Scaling"
                detail="Whether growth is safe, blocked, or under pressure."
              />
            </div>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

function SignalCard({ signal }: { signal: CommandSignal }) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(255,255,255,0.62)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif-display text-xl font-semibold text-[var(--ink)]">
            {signal.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {signal.detail}
          </p>
        </div>
        <StatusPill status={signal.status} />
      </div>
    </div>
  );
}

function OperatorRow({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--line)] bg-[rgba(255,255,255,0.62)] p-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {label}
          </div>
          <div className="mt-1 text-sm font-semibold text-[var(--ink)]">{value}</div>
        </div>
        <StatusPill status={status} />
      </div>
    </div>
  );
}

function ProxyMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--line)] bg-[rgba(255,255,255,0.62)] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[var(--ink)]">{value}</div>
      <div className="mt-1 text-sm leading-6 text-[var(--muted)]">{hint}</div>
    </div>
  );
}

function LogicRow({ metric, logic }: { metric: string; logic: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--line)] bg-[rgba(255,255,255,0.62)] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {metric}
      </div>
      <div className="mt-2 text-sm leading-6 text-[var(--ink)]">{logic}</div>
    </div>
  );
}

function QuickLinkCard({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <Link
      href={href}
      className="rounded-[22px] border border-[var(--line)] bg-[rgba(255,255,255,0.62)] p-4 transition hover:border-[var(--accent)] hover:bg-white"
    >
      <div className="font-serif-display text-xl font-semibold text-[var(--ink)]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
    </Link>
  );
}
