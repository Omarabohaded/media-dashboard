"use client";

import {
  AppShell,
  EmptySectionState,
  MiniMetric,
  Section,
  SourcePill,
} from "@/components/AppShell";
import { evaluateScaling } from "@/lib/scalingEngine";
import { useDashboardReadiness } from "@/lib/useDashboardReadiness";
import { evaluateTrackingGap, formatPercent } from "@/lib/workbookSignals";

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

export default function ScalingPage() {
  const { activeClient, metaPreview, metaStatus, storePreview, storeStatus } =
    useDashboardReadiness();

  const hasMeta = Boolean(metaPreview && metaStatus?.selectedAccountId);
  const hasStoreTruth = Boolean(storePreview);
  const hasStoreAnalytics = false;
  const totalSpend = metaPreview?.totals.spend ?? 0;
  const storeRevenue = storePreview?.grossSales ?? 0;
  const blendedRoas =
    hasMeta && totalSpend > 0 ? metaPreview!.totals.purchaseValue / totalSpend : 0;
  const mer = hasMeta && hasStoreTruth && totalSpend > 0 ? storeRevenue / totalSpend : 0;
  const purchaseVolume = metaPreview?.totals.purchases ?? 0;
  const averageFrequency =
    metaPreview && metaPreview.rows.length
      ? metaPreview.rows.reduce((sum, row) => sum + row.frequency, 0) /
        metaPreview.rows.length
      : 0;
  const averageCtr =
    metaPreview && metaPreview.rows.length
      ? metaPreview.rows.reduce((sum, row) => sum + row.ctr, 0) / metaPreview.rows.length
      : 0;
  const purchaseCvr =
    metaPreview && metaPreview.totals.clicks > 0
      ? (metaPreview.totals.purchases / metaPreview.totals.clicks) * 100
      : 0;
  const checkoutCompletionRate =
    metaPreview && metaPreview.rows.length
      ? (metaPreview.rows.reduce((sum, row) => sum + row.purchases, 0) /
          Math.max(
            metaPreview.rows.reduce(
              (sum, row) => sum + (row.checkoutInitiated ?? 0),
              0
            ),
            1
          )) *
        100
      : null;
  const trackingGap = evaluateTrackingGap({
    storeRevenue: hasStoreTruth ? storeRevenue : undefined,
    platformRevenue: hasMeta ? metaPreview?.totals.purchaseValue : undefined,
    storeOrders: hasStoreTruth ? storePreview?.ordersCount : undefined,
    platformPurchases: hasMeta ? metaPreview?.totals.purchases : undefined,
  });

  const scalingDecision = evaluateScaling({
    merStatus:
      !hasStoreTruth || !hasMeta ? "warning" : mer >= 2.2 ? "healthy" : "warning",
    merTrend: "stable",
    hasCreativeFatigue: averageFrequency > 2.5 && averageCtr < 1.2,
    revenueGrowth: 0,
    spendGrowth: 0,
    priorityScore: !hasStoreTruth ? 90 : mer >= 2.2 ? 72 : 88,
    trackingMismatch: trackingGap.active,
    checkoutFailure:
      typeof checkoutCompletionRate === "number" && checkoutCompletionRate < 35,
    businessTruthFailure: !hasStoreTruth,
    trafficQualityIssue: averageCtr > 2 && purchaseCvr < 1,
  });

  const blockScaling = !hasStoreTruth || !hasMeta || !hasStoreAnalytics;

  return (
    <AppShell>
      <div className="space-y-5">
        <Section
          title="Scaling Engine"
          subtitle="Lamba's rule set says scaling should be blocked whenever business truth, tracking truth, or checkout truth is missing."
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <SourcePill
              label={hasMeta ? "Meta spend connected" : "Meta spend missing"}
              tone={hasMeta ? "good" : "warn"}
            />
            <SourcePill
              label={hasStoreTruth ? "Store truth connected" : "Store truth missing"}
              tone={hasStoreTruth ? "good" : "warn"}
            />
            <SourcePill
              label={hasStoreAnalytics ? "Sessions and funnel truth connected" : "Sessions and funnel truth still missing"}
              tone={hasStoreAnalytics ? "good" : "warn"}
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

          {blockScaling ? (
            <EmptySectionState
              title="Scaling is intentionally blocked"
              description="This is now aligned with the workbook and the Lamba rules: the dashboard must not recommend scaling off platform optimism alone. MER, checkout quality, and store truth must all be in place first."
              bullets={[
                hasMeta
                  ? "Meta preview is live for this client."
                  : "Connect Meta and save the ad account in Admin first.",
                hasStoreTruth
                  ? "Store revenue and orders are available."
                  : storeStatus?.recommendedNextStep ??
                    "Connect Shopify or WordPress/WooCommerce for store truth.",
                trackingGap.ready
                  ? trackingGap.summary
                  : "Tracking-gap logic becomes available after both store truth and platform attribution are connected.",
                "Sessions, LPV, ATC, checkout rate, and purchase CVR still need analytics truth before scaling can be trusted.",
              ]}
            />
          ) : null}

          <div
            className={`mt-5 rounded-2xl border p-5 ${
              scalingDecision.status === "danger"
                ? "border-red-500 bg-red-950/20"
                : scalingDecision.status === "cautious"
                ? "border-yellow-500 bg-yellow-950/20"
                : "border-cyan-500 bg-cyan-950/20"
            }`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm text-slate-400">Scaling Decision</div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {blockScaling ? "BLOCKED" : scalingDecision.status.toUpperCase()}
                </div>
                <div className="mt-2 max-w-2xl text-slate-300">
                  {blockScaling
                    ? "The system is correctly refusing to scale because the business-truth layer is still incomplete."
                    : scalingDecision.summary}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Confidence</div>
                <div className="text-2xl font-bold text-cyan-300">
                  {blockScaling ? "0%" : `${scalingDecision.confidence}%`}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <MiniMetric
                label="Risk Level"
                value={blockScaling ? "High" : scalingDecision.riskLevel}
                hint="Business-truth and tracking gaps raise scaling risk."
              />
              <MiniMetric
                label="Recommended Scale"
                value={blockScaling ? "0%" : `${scalingDecision.recommendedScalePercent}%`}
                hint="Budget increases stay blocked until source gaps are resolved."
              />
              <MiniMetric
                label="Recommendation"
                value={blockScaling ? "Fix before scaling" : scalingDecision.recommendation}
                hint="This follows the rule hierarchy, not just ROAS optimism."
              />
            </div>
          </div>
        </Section>

        <Section
          title="Signals Used"
          subtitle="These are the current workbook-aligned inputs available for the selected client."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric
              label="Store Revenue"
              value={hasStoreTruth ? formatMoney(storeRevenue, storePreview!.currencyCode) : "Waiting"}
              hint="Website truth"
              tone={hasStoreTruth ? "good" : "warn"}
            />
            <MiniMetric
              label="Ad Spend"
              value={hasMeta ? formatMoney(totalSpend, metaStatus?.selectedAccount?.currency ?? "USD") : "Waiting"}
              hint="Platform spend layer"
              tone={hasMeta ? "good" : "warn"}
            />
            <MiniMetric
              label="MER"
              value={hasMeta && hasStoreTruth ? `${formatNumber(mer, 2)}x` : "Not ready"}
              hint="Store revenue divided by ad spend"
              tone={hasMeta && hasStoreTruth ? "good" : "warn"}
            />
            <MiniMetric
              label="Blended ROAS"
              value={hasMeta ? `${formatNumber(blendedRoas, 2)}x` : "Waiting"}
              hint="Platform-attributed value divided by spend"
              tone={hasMeta ? "good" : "warn"}
            />
            <MiniMetric
              label="Average Frequency"
              value={hasMeta ? formatNumber(averageFrequency, 2) : "Waiting"}
              hint="Creative fatigue input"
              tone={hasMeta ? (averageFrequency > 2.5 ? "warn" : "good") : "warn"}
            />
            <MiniMetric
              label="Average CTR"
              value={hasMeta ? `${formatNumber(averageCtr, 2)}%` : "Waiting"}
              hint="Traffic quality input"
              tone={hasMeta ? "good" : "warn"}
            />
            <MiniMetric
              label="Purchases"
              value={hasMeta ? formatNumber(purchaseVolume) : "Waiting"}
              hint="Meta preview only"
              tone={hasMeta ? "good" : "warn"}
            />
            <MiniMetric
              label="Client"
              value={activeClient?.name ?? "No client selected"}
              hint={activeClient?.websitePlatform ?? "Create a client in Admin"}
              tone="default"
            />
            <MiniMetric
              label="Tracking Gap"
              value={
                trackingGap.ready
                  ? trackingGap.active
                    ? formatPercent(
                        Math.max(
                          trackingGap.revenueGapRatio ?? 0,
                          trackingGap.orderGapRatio ?? 0
                        )
                      )
                    : "Within range"
                  : "Waiting"
              }
              hint="Workbook rule: compare platform attribution vs website/store truth before trusting scale."
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
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
