"use client";

import { AppShell, MiniMetric, Section } from "@/components/AppShell";
import { generateActions } from "../../lib/actionEngine";
import { evaluateRelationships } from "../../lib/relationshipEngine";
import { prioritizeSignals } from "../../lib/priorityEngine";
import { detectRootCauses } from "../../lib/crossMetricEngine";
export default function ActionPage() {
const relationshipSignals = evaluateRelationships({
  mer: 1.8,
  ctr: 2.3,
  cvr: 0.8,
  roas: 1.9,
  ncac: 240,
  frequency: 3.1,
  spendGrowth: 25,
  revenueGrowth: 10,
  bounceRate: 62,
  checkoutCompletionRate: 31,
  backendConversions: 212,
  platformConversions: 298,
  trackingMismatch: true,
  checkoutFailure: true,
});

const prioritizedSignals = prioritizeSignals(
  relationshipSignals
);

const actions = generateActions(prioritizedSignals);
const riskActions = actions.filter((action) => action.lane === "risk");
const opportunityActions = actions.filter((action) => action.lane === "opportunity");
const rootCauses = detectRootCauses({
  ctr: 2.3,
  frequency: 3.1,
  mer: 1.8,
  cpc: 2.4,
  cvr: 0.8,
  spendGrowth: 25,
  revenueGrowth: 10,
  bounceRate: 62,
  checkoutRate: 31,
  purchaseCvr: 0.9,
  backendConversions: 212,
  platformConversions: 298,
});
  return (
    <AppShell>
      <div className="space-y-5">
        <Section title="What Needs Action?" subtitle="Prioritized action list for daily media buying decisions.">
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm uppercase text-red-300">
                    Risk Lane
                  </div>
                  <div className="mt-1 text-xl font-bold text-white">
                    Resolve business risks first
                  </div>
                </div>
                <div className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white">
                  {riskActions.length} items
                </div>
              </div>
              <div className="space-y-4">
                {riskActions.map((action, index) => (
                  <div
                    key={action.id}
                    className={`rounded-2xl border p-5 ${
                      action.severity === "healthy"
                        ? "border-green-500 bg-green-950/20"
                        : action.severity === "warning"
                        ? "border-yellow-500 bg-yellow-950/20"
                        : "border-red-500 bg-red-950/20"
                    }`}
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

                    <div className="mt-2 text-sm text-slate-300">
                      {action.reason}
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <div className="text-xs uppercase text-slate-500">
                        Recommended Action
                      </div>

                      <div className="mt-1 text-sm text-white">
                        {action.recommendation}
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-950/70 p-3">
                      <div className="text-xs uppercase text-slate-500">
                        Expected Impact
                      </div>

                      <div className="mt-1 text-sm text-cyan-300">
                        {action.expectedImpact}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="text-slate-400">
                        Confidence:{" "}
                        <span className="text-white">
                          {action.confidence}
                        </span>
                      </div>

                      <div className="text-slate-400">
                        Score:{" "}
                        <span className="text-white">
                          {action.score}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm uppercase text-emerald-300">
                    Opportunity Lane
                  </div>
                  <div className="mt-1 text-xl font-bold text-white">
                    Scale only after the risk lane is clean
                  </div>
                </div>
                <div className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white">
                  {opportunityActions.length} items
                </div>
              </div>

              <div className="space-y-4">
                {opportunityActions.length ? opportunityActions.map((action, index) => (
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

                    <div className="mt-2 text-sm text-slate-300">
                      {action.reason}
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-white">
                      {action.recommendation}
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-300">
                    No scaling opportunities are being promoted because active business risks still need attention.
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>
<Section
  title="Root Cause Intelligence"
  subtitle="Cross-metric diagnosis based on connected signals."
>
  <div className="grid gap-5 md:grid-cols-2">
    {rootCauses.map((cause) => (
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
          <div className="text-sm uppercase text-slate-400">
            Root Cause
          </div>

          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">
            {cause.confidence} Confidence
          </div>
        </div>

        <h3 className="mt-3 text-xl font-bold text-white">
          {cause.title}
        </h3>

        <p className="mt-3 text-sm text-slate-300">
          {cause.diagnosis}
        </p>

        <div className="mt-4 rounded-xl bg-slate-950/70 p-3 text-sm text-cyan-300">
          Action: {cause.recommendation}
        </div>
      </div>
    ))}
  </div>
</Section>
        <Section title="Action Logic" subtitle="How the system is currently thinking.">
          <div className="grid gap-5 md:grid-cols-2">
            <MiniMetric label="Do Not" value="Scale all channels" hint="Scaling should follow MER + CPA + benchmark status." tone="bad" />
            <MiniMetric label="Do" value="Reallocate budget" hint="Move budget toward stronger MER channels." tone="good" />
            <MiniMetric label="Audit" value="Google + TikTok" hint="CPA and MER pressure detected." tone="warn" />
            <MiniMetric label="Prepare" value="Creative refresh" hint="Avoid fatigue before spend increase." tone="warn" />
          </div>
        </Section>
      </div>
    </AppShell>
  );
}