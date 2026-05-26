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
import { getFunnelReadiness } from "@/lib/funnelReadiness";
import { useDashboardReadiness } from "@/lib/useDashboardReadiness";
import { evaluateTrackingGap } from "@/lib/workbookSignals";

function formatMoney(value: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
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
  const {
    activeClient,
    isLoading,
    message,
    metaPreview,
    metaStatus,
    storePreview,
    storeStatus,
  } = useDashboardReadiness();

  const hasMeta = Boolean(metaPreview && metaStatus?.selectedAccountId);
  const hasStoreTruth = Boolean(storePreview);
  const storeCurrency = storePreview?.currencyCode ?? activeClient?.currencyCode ?? "USD";
  const spend = metaPreview?.totals.spend ?? 0;
  const revenue = storePreview?.grossSales ?? 0;
  const orders = storePreview?.ordersCount ?? 0;
  const mer = hasMeta && hasStoreTruth && spend > 0 ? revenue / spend : null;
  const blendedRoas = hasMeta && spend > 0 ? metaPreview!.totals.purchaseValue / spend : null;
  const aov = hasStoreTruth && orders > 0 ? revenue / orders : null;
  const clicks = metaPreview?.totals.clicks ?? 0;
  const platformPurchases = metaPreview?.totals.purchases ?? 0;
  const purchaseProxyCvr = hasMeta && clicks > 0 ? (platformPurchases / clicks) * 100 : null;
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

  const summary = hasStoreTruth && hasMeta
    ? mer !== null && mer >= 2
      ? "Business truth is readable. Use this page for the top call, then go deeper into the tabs for the why."
      : "Spend and revenue are both visible, but business efficiency is soft enough that deeper diagnosis belongs in Business Health, Funnel, and Paid Media."
    : "This command center now stays honest. It shows the cross-tab summary, but it stops short of pretending the detail tabs are ready when truth layers are still missing.";

  if (isLoading) {
    return (
      <AppShell>
        <DashboardLoadingState
          title="Loading command center"
          description="Pulling the active client, business truth, platform truth, and readiness signals now."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageLead
          eyebrow="Command Center"
          title={activeClient ? `${activeClient.name} decision view` : "Decision-first command center"}
          summary={summary}
        />

        <div className="flex flex-wrap gap-2">
          <SourcePill
            label={hasStoreTruth ? "Store truth connected" : "Store truth missing"}
            tone={hasStoreTruth ? "good" : "warn"}
          />
          <SourcePill
            label={hasMeta ? "Paid media source connected" : "Paid media source missing"}
            tone={hasMeta ? "good" : "warn"}
          />
          <SourcePill
            label={
              blockedFunnelMetrics > 0
                ? `${blockedFunnelMetrics} funnel metrics still blocked`
                : "Funnel layer fully readable"
            }
            tone={blockedFunnelMetrics > 0 ? "warn" : "good"}
          />
          <SourcePill
            label={
              trackingGap.ready
                ? trackingGap.active
                  ? "Tracking gap needs review"
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

        {!hasStoreTruth && !hasMeta ? (
          <EmptySectionState
            title="The command center is ready, but the truth layers are not"
            description="The homepage is now an overview only. To unlock real tab-level analysis, connect store truth and at least one paid media source for the active client."
            bullets={[
              `Active client: ${activeClient?.name ?? "No client selected"}`,
              storeStatus?.recommendedNextStep ?? "Connect Shopify or WordPress/WooCommerce first.",
              metaStatus?.connectionError ?? "Then connect Meta and save the correct ad account in Admin.",
              message ?? "Once those are connected, each tab will show its own deeper numbers instead of reusing the homepage sections.",
            ]}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MiniMetric
            label="Store Revenue"
            value={hasStoreTruth ? formatMoney(revenue, storeCurrency) : "Waiting"}
            hint="Business truth"
            tone={hasStoreTruth ? "good" : "warn"}
          />
          <MiniMetric
            label="Orders"
            value={hasStoreTruth ? formatNumber(orders) : "Waiting"}
            hint="Completed website orders"
            tone={hasStoreTruth ? "good" : "warn"}
          />
          <MiniMetric
            label="Ad Spend"
            value={hasMeta ? formatMoney(spend, metaStatus?.selectedAccount?.currency ?? "USD") : "Waiting"}
            hint="Connected paid-media spend"
            tone={hasMeta ? "good" : "warn"}
          />
          <MiniMetric
            label="MER"
            value={mer !== null ? `${formatNumber(mer, 2)}x` : "Waiting"}
            hint="Store revenue divided by ad spend"
            tone={mer !== null ? (mer >= 2 ? "good" : "warn") : "warn"}
          />
          <MiniMetric
            label="Blended ROAS"
            value={blendedRoas !== null ? `${formatNumber(blendedRoas, 2)}x` : "Waiting"}
            hint="Platform-attributed revenue divided by spend"
            tone={blendedRoas !== null ? "good" : "warn"}
          />
          <MiniMetric
            label="AOV"
            value={aov !== null ? formatMoney(aov, storeCurrency) : "Waiting"}
            hint="Revenue divided by orders"
            tone={aov !== null ? "good" : "warn"}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
          <Section
            title="Top Read"
            subtitle="One summary, then clear paths into the deeper tabs."
          >
            <div className="space-y-4">
              <SignalCard
                title={
                  mer === null
                    ? "Business efficiency is not fully readable yet"
                    : mer >= 2
                    ? "Business efficiency is stable enough to operate from"
                    : "Business efficiency needs deeper diagnosis"
                }
                detail={
                  mer === null
                    ? "MER and final scale decisions still depend on both store truth and paid-media spend."
                    : mer >= 2
                    ? "The overview supports daily monitoring, but real decisions should still move into the dedicated Business Health, Funnel, Paid Media, and Scaling tabs."
                    : "The overview already tells you there is a problem. The next step is to use the deeper tabs to see whether the pressure is coming from traffic quality, funnel friction, or tracking mismatch."
                }
                status={mer === null ? "Waiting" : mer >= 2 ? "Stable" : "Actionable"}
              />
              <SignalCard
                title={trackingGap.ready ? "Tracking trust is being checked" : "Tracking trust is still incomplete"}
                detail={trackingGap.summary}
                status={trackingGap.ready ? (trackingGap.active ? "Review" : "Healthy") : "Blocked"}
              />
              <SignalCard
                title={
                  purchaseProxyCvr !== null
                    ? "Funnel proxy is available"
                    : "Funnel proxy is still incomplete"
                }
                detail={
                  purchaseProxyCvr !== null
                    ? `Platform-side purchase CVR is ${formatNumber(purchaseProxyCvr, 1)}%, but the workbook still prefers session-based website truth in the Funnel tab.`
                    : "The Funnel tab now exists as its own workspace, but it will stay honest about what is blocked until analytics truth is connected."
                }
                status={purchaseProxyCvr !== null ? "Partial" : "Blocked"}
              />
            </div>
          </Section>

          <Section
            title="Go Deeper"
            subtitle="Each tab now has its own job instead of scrolling you down the homepage."
          >
            <div className="grid gap-3">
              <QuickLinkCard
                href="/health"
                title="Business Health"
                detail="Store truth, MER, blended ROAS, and tracking trust."
              />
              <QuickLinkCard
                href="/funnel"
                title="Funnel"
                detail="Sessions, step rates, drop-off diagnosis, and funnel readiness."
              />
              <QuickLinkCard
                href="/paid-media"
                title="Paid Media"
                detail="Campaign-level delivery, efficiency, and spend allocation reads."
              />
              <QuickLinkCard
                href="/scaling"
                title="Scaling"
                detail="Whether growth is actually safe, blocked, or ready."
              />
              <QuickLinkCard
                href="/action"
                title="Actions"
                detail="Ranked next moves with risk and opportunity lanes."
              />
            </div>
          </Section>
        </div>

        <Section
          title="Cross-Tab Readiness"
          subtitle="This replaces the old long-scroll behavior with a clearer view of what each analysis page can trust today."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <ReadinessTile
              label="Business Health"
              status={hasStoreTruth && hasMeta ? "Ready" : "Partial"}
              hint="Needs store truth plus paid-media spend."
            />
            <ReadinessTile
              label="Funnel"
              status={blockedFunnelMetrics < funnelReadiness.length ? "Partial" : "Blocked"}
              hint="Needs site analytics for full session-based truth."
            />
            <ReadinessTile
              label="Paid Media"
              status={hasMeta ? "Ready" : "Blocked"}
              hint="Campaign-level reads start after the connected ad account is saved."
            />
            <ReadinessTile
              label="Scaling"
              status={hasStoreTruth && hasMeta && blockedFunnelMetrics === 0 ? "Ready" : "Blocked"}
              hint="Should stay blocked until business truth and funnel truth are both dependable."
            />
            <ReadinessTile
              label="Actions"
              status={hasMeta ? "Partial" : "Blocked"}
              hint="Can start with media-side warnings, then improve once business truth is connected."
            />
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

function SignalCard({
  title,
  detail,
  status,
}: {
  title: string;
  detail: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.58)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--ink)]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
        </div>
        <StatusPill status={status} />
      </div>
    </div>
  );
}

function QuickLinkCard({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.58)] p-4 transition hover:border-[var(--accent)] hover:bg-[rgba(255,255,255,0.8)]"
    >
      <div className="text-base font-semibold text-[var(--ink)]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
    </Link>
  );
}

function ReadinessTile({
  label,
  status,
  hint,
}: {
  label: string;
  status: string;
  hint: string;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(255,255,255,0.58)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          {label}
        </p>
        <StatusPill status={status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{hint}</p>
    </div>
  );
}
