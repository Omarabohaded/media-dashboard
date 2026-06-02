"use client";

import {
  AppShell,
  DashboardLoadingState,
  EmptySectionState,
  MiniMetric,
  Section,
  SourcePill,
} from "@/components/AppShell";
import { generateActions } from "@/lib/actionEngine";
import { detectRootCauses } from "@/lib/crossMetricEngine";
import {
  getCpaDenominatorLabel,
  getEffectiveBlendedRoas,
  getEffectiveCpaCac,
  getEffectiveCpc,
  getEffectiveCtr,
  getEffectiveMer,
  getEffectiveOrders,
  getEffectiveStoreRevenue,
} from "@/lib/dashboardMetricLogic";
import { getFunnelReadiness } from "@/lib/funnelReadiness";
import { prioritizeSignals } from "@/lib/priorityEngine";
import { evaluateRelationships } from "@/lib/relationshipEngine";
import { useDashboardReadiness } from "@/lib/useDashboardReadiness";
import { evaluateTrackingGap } from "@/lib/workbookSignals";

export default function ActionPage() {
  const {
    activeClient,
    isLoading,
    metaPreview,
    metaStatus,
    storePreview,
    storeStatus,
    metricLogic,
  } = useDashboardReadiness();

  const hasMeta = Boolean(metaPreview && metaStatus?.selectedAccountId);
  const hasStoreTruth = Boolean(storePreview);
  const averageCtr = getEffectiveCtr(metaPreview, metricLogic) ??
    (metaPreview && metaPreview.rows.length
      ? metaPreview.rows.reduce((sum, row) => sum + row.ctr, 0) / metaPreview.rows.length
      : 0);
  const averageFrequency =
    metaPreview && metaPreview.rows.length
      ? metaPreview.rows.reduce((sum, row) => sum + row.frequency, 0) /
        metaPreview.rows.length
      : 0;
  const averageCpc = getEffectiveCpc(metaPreview, metricLogic) ?? 0;
  const purchaseCvr =
    metaPreview && metaPreview.totals.clicks > 0
      ? (metaPreview.totals.purchases / metaPreview.totals.clicks) * 100
      : 0;
  const roas = getEffectiveBlendedRoas(metaPreview, metricLogic) ?? 0;
  const mer = getEffectiveMer(storePreview, metaPreview, metricLogic) ?? 0;
  const configuredCac = getEffectiveCpaCac(metaPreview, storePreview, metricLogic);
  const ncac = configuredCac.value ?? 999;
  const storeOrders = getEffectiveOrders(storePreview, metricLogic);
  const checkoutRate =
    metaPreview && metaPreview.totals.purchases > 0
      ? (metaPreview.rows.reduce((sum, row) => sum + (row.checkoutInitiated ?? 0), 0) /
          Math.max(metaPreview.rows.reduce((sum, row) => sum + (row.addToCart ?? 0), 1), 1)) *
        100
      : 0;
  const checkoutCompletionRate =
    metaPreview &&
    metaPreview.rows.reduce((sum, row) => sum + (row.checkoutInitiated ?? 0), 0) > 0
      ? (metaPreview.totals.purchases /
          Math.max(
            metaPreview.rows.reduce((sum, row) => sum + (row.checkoutInitiated ?? 0), 0),
            1
          )) *
        100
      : null;
  const trackingGap = evaluateTrackingGap({
    storeRevenue: hasStoreTruth
      ? getEffectiveStoreRevenue(storePreview, metricLogic)
      : undefined,
    platformRevenue: hasMeta ? metaPreview?.totals.purchaseValue : undefined,
    storeOrders: hasStoreTruth ? storeOrders : undefined,
    platformPurchases: hasMeta ? metaPreview?.totals.purchases : undefined,
  });
  const funnelReadiness = getFunnelReadiness({
    storePreview,
    metaPreview,
    analyticsConnected: false,
  });
  const checkoutCompletionMetric = funnelReadiness.find(
    (metric) => metric.id === "checkout_completion_rate"
  );

  const relationshipSignals = hasMeta
    ? evaluateRelationships({
        mer: hasStoreTruth ? mer : undefined,
        ctr: averageCtr,
        cvr: purchaseCvr,
        roas,
        ncac,
        frequency: averageFrequency,
        checkoutCompletionRate: checkoutCompletionRate || undefined,
        backendConversions: hasStoreTruth ? storeOrders : undefined,
        platformConversions: hasMeta ? metaPreview?.totals.purchases : undefined,
        trackingMismatch: trackingGap.active,
        checkoutFailure:
          typeof checkoutCompletionRate === "number" && checkoutCompletionRate < 35,
        merBelowThreshold: hasStoreTruth ? mer < 2.2 : true,
      })
    : [];

  const prioritizedSignals = prioritizeSignals(relationshipSignals);
  const actions = generateActions(prioritizedSignals);
  const riskActions = actions.filter((action) => action.lane === "risk");
  const opportunityActions = actions.filter(
    (action) => action.lane === "opportunity"
  );
  const rootCauses = hasMeta
    ? detectRootCauses({
        ctr: averageCtr,
        frequency: averageFrequency,
        mer: hasStoreTruth ? mer : 0,
        cpc: averageCpc,
        cvr: purchaseCvr,
        checkoutRate: checkoutRate || undefined,
        purchaseCvr,
        backendConversions: hasStoreTruth ? storeOrders : undefined,
        platformConversions: hasMeta ? metaPreview?.totals.purchases : undefined,
      })
    : [];

  if (isLoading) {
    return (
      <AppShell>
        <DashboardLoadingState
          title="Loading action triage"
          description="Pulling live signals, relationship checks, and risk-vs-opportunity priorities for the active client."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <Section
          title="What Needs Action?"
          subtitle="This page now uses live relationship signals when they exist, and it avoids inventing business recommendations when store truth is still missing."
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <SourcePill
              label={hasMeta ? "Meta preview live" : "Meta preview missing"}
              tone={hasMeta ? "good" : "warn"}
            />
            <SourcePill
              label={hasStoreTruth ? "Business truth connected" : "Business truth missing"}
              tone={hasStoreTruth ? "good" : "warn"}
            />
            <SourcePill
              label={
                trackingGap.ready
                  ? trackingGap.active
                    ? "Tracking gap needs review"
                    : "Tracking gap within range"
                  : "Tracking gap not ready yet"
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
              label={`CPA / CAC uses ${getCpaDenominatorLabel(
                configuredCac.appliedDenominator
              )}`}
              tone={configuredCac.blockedReason ? "warn" : "default"}
            />
            <SourcePill
              label={
                checkoutCompletionMetric?.state === "partial"
                  ? "Funnel proxy is partial only"
                  : "Funnel truth still blocked"
              }
              tone={
                checkoutCompletionMetric?.state === "partial" ? "default" : "warn"
              }
            />
          </div>

          {!hasMeta ? (
            <EmptySectionState
              title="There is no live media data to triage yet"
              description="This action page needs at least one connected ad account before it can prioritize anything. It now stays empty instead of filling itself with believable sample issues."
              bullets={[
                `Active client: ${activeClient?.name ?? "No client selected"}`,
                "Connect Meta and save the ad account in Admin.",
                "After that, the page will start surfacing platform-side warnings even before full store truth is connected.",
              ]}
            />
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm uppercase text-red-300">Risk Lane</div>
                    <div className="mt-1 text-xl font-bold text-white">
                      Resolve business risks first
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white">
                    {riskActions.length} items
                  </div>
                </div>

                <div className="space-y-4">
                  {riskActions.length ? (
                    riskActions.map((action, index) => (
                      <div
                        key={action.id}
                        className="rounded-2xl border border-red-500/30 bg-slate-950/70 p-5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm uppercase text-slate-400">
                            {action.actionType}
                          </div>
                          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">
                            {action.priority}
                          </div>
                        </div>
                        <div className="mt-3 text-2xl font-bold text-white">
                          {index + 1}. {action.title}
                        </div>
                        <div className="mt-2 text-sm text-slate-300">{action.reason}</div>
                        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                          <div className="text-xs uppercase text-slate-500">
                            Recommended Action
                          </div>
                          <div className="mt-1 text-sm text-white">
                            {action.recommendation}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-300">
                      No urgent risk actions are firing from the current live signals.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm uppercase text-emerald-300">
                      Opportunity Lane
                    </div>
                    <div className="mt-1 text-xl font-bold text-white">
                      Promote only what survives the risk checks
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white">
                    {opportunityActions.length} items
                  </div>
                </div>

                <div className="space-y-4">
                  {opportunityActions.length ? (
                    opportunityActions.map((action, index) => (
                      <div
                        key={action.id}
                        className="rounded-2xl border border-emerald-500/30 bg-slate-950/60 p-5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm uppercase text-emerald-300">
                            {action.actionType}
                          </div>
                          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">
                            {action.priority}
                          </div>
                        </div>
                        <div className="mt-3 text-2xl font-bold text-white">
                          {index + 1}. {action.title}
                        </div>
                        <div className="mt-2 text-sm text-slate-300">{action.reason}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-300">
                      No scaling opportunity is being promoted right now.{" "}
                      {!hasStoreTruth
                        ? "That is intentional because business truth is still missing."
                        : "The current signals are not strong enough yet."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Section>

        <Section
          title="Root Cause Intelligence"
          subtitle="These diagnoses are driven by current connected signals instead of static examples."
        >
          {!hasMeta ? (
            <EmptySectionState
              title="Root-cause analysis starts after the first live media connection"
              description="Once Meta is live for this client, this panel will inspect CTR, frequency, CPC, conversion quality, and other connected metrics. Until then, it stays empty on purpose."
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {rootCauses.length ? (
                rootCauses.map((cause) => (
                  <div
                    key={cause.title}
                    className={`rounded-2xl border p-5 ${
                      cause.severity === "danger"
                        ? "border-red-500 bg-red-950/20"
                        : cause.severity === "warning"
                        ? "border-yellow-500 bg-yellow-950/20"
                        : "border-green-500 bg-green-950/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm uppercase text-slate-400">Root Cause</div>
                      <div className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">
                        {cause.confidence} Confidence
                      </div>
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-white">{cause.title}</h3>
                    <p className="mt-3 text-sm text-slate-300">{cause.diagnosis}</p>
                    <div className="mt-4 rounded-xl bg-slate-950/70 p-3 text-sm text-cyan-300">
                      Action: {cause.recommendation}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-300">
                  No root cause pattern has crossed the current thresholds yet.
                </div>
              )}
            </div>
          )}
        </Section>

        <Section
          title="Funnel Truth Status"
          subtitle="These metrics follow the workbook rule that platform funnel events are only directional until website analytics truth is connected."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {funnelReadiness.map((metric) => (
              <MiniMetric
                key={metric.id}
                label={metric.label}
                value={metric.value}
                hint={`${metric.source} · ${metric.hint}`}
                tone={
                  metric.state === "ready"
                    ? "good"
                    : metric.state === "partial"
                    ? "default"
                    : "warn"
                }
              />
            ))}
          </div>
        </Section>

        <Section
          title="Action Logic"
          subtitle="This mirrors the workbook priority: business truth first, then platform optimization."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <MiniMetric
              label="Do Not"
              value={!hasStoreTruth ? "Scale from platform-only optimism" : "Ignore the risk lane"}
              hint="The dashboard now blocks that path."
              tone="bad"
            />
            <MiniMetric
              label="Do"
              value={hasStoreTruth ? "Compare business truth vs platform truth" : "Connect store truth next"}
              hint={storeStatus?.recommendedNextStep ?? "This is the next highest-value step."}
              tone="good"
            />
            <MiniMetric
              label="Media Read"
              value={hasMeta ? "Live Meta preview active" : "No live media source yet"}
              hint="Platform-side observations can start before full blended logic."
              tone={hasMeta ? "good" : "warn"}
            />
            <MiniMetric
              label="Business Read"
              value={hasStoreTruth ? "Store truth available" : "Still incomplete"}
              hint="Revenue, orders, MER, and final scale logic depend on this."
              tone={hasStoreTruth ? "good" : "warn"}
            />
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
