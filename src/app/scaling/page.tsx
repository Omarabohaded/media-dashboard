"use client";

import { AppShell, MiniMetric, Section, StatusPill } from "@/components/AppShell";
import { money, num, platformRows } from "@/lib/mockData";
import { evaluateScaling } from "@/lib/scalingEngine";

export default function ScalingPage() {
  const scalingDecision = evaluateScaling({
  merStatus: "warning",
  merTrend: "declining",
  hasCreativeFatigue: true,
  revenueGrowth: 10,
  spendGrowth: 25,
  priorityScore: 69,
  trackingMismatch: true,
  checkoutFailure: true,
  businessTruthFailure: true,
  trafficQualityIssue: true,
});
  return (
    <AppShell>
      <div className="space-y-5">
        <Section title="Scaling Engine" subtitle="Can we increase spend safely? This is the main page for performance marketers/scalers.">
          <div className="space-y-4">
            <div className={`rounded-2xl border p-5 ${
              scalingDecision.status === "danger"
                ? "border-red-500 bg-red-950/20"
                : scalingDecision.status === "cautious"
                ? "border-yellow-500 bg-yellow-950/20"
                : "border-cyan-500 bg-cyan-950/20"
            }`}>
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm text-slate-400">
        SCALING DECISION
      </div>

      <div className="mt-2 text-3xl font-bold text-white">
        {scalingDecision.status.toUpperCase()}
      </div>

      <div className="mt-2 text-slate-300">
        {scalingDecision.summary}
      </div>
    </div>

    <div className="text-right">
      <div className="text-sm text-slate-400">
        Confidence
      </div>

      <div className="text-2xl font-bold text-cyan-300">
        {scalingDecision.confidence}%
      </div>
    </div>
  </div>

  {scalingDecision.recommendedScalePercent === 0 ? (
    <div className="mt-5 rounded-2xl border border-red-500/30 bg-slate-950/60 p-4">
      <div className="text-xs uppercase text-red-300">
        Scaling Blocked
      </div>
      <div className="mt-2 text-sm text-slate-300">
        The current decision layer is intentionally blocking budget increases because business-truth, tracking, or checkout issues are active.
      </div>
    </div>
  ) : null}

  <div className="mt-5 grid gap-4 md:grid-cols-3">
    <MiniMetric
      label="Risk Level"
      value={scalingDecision.riskLevel}
      hint="Current scaling risk."
    />

    <MiniMetric
      label="Recommended Scale"
      value={`${scalingDecision.recommendedScalePercent}%`}
      hint="Suggested safe increase."
    />

    <MiniMetric
      label="Recommendation"
      value={scalingDecision.recommendation}
      hint="System guidance."
    />
  </div>
</div>
            {platformRows.map((row) => (
              <div key={row.platform} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xl font-black">{row.platform}</h4>
                    <p className="text-sm text-slate-400">{row.recommendation}</p>
                  </div>
                  <StatusPill status={row.scaleSignal} />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <MiniMetric label="MER" value={`${num(row.mer, 2)}x`} hint={`Benchmark ${num(row.benchmarkMer, 2)}x`} tone={row.mer >= row.benchmarkMer ? "good" : "bad"} />
                  <MiniMetric label="CPA" value={money(row.cpa)} hint={`Benchmark ${money(row.benchmarkCpa)}`} tone={row.cpa <= row.benchmarkCpa ? "good" : "bad"} />
                  <MiniMetric label="CTR" value={`${num(row.ctr, 2)}%`} hint={`Benchmark ${num(row.benchmarkCtr, 2)}%`} tone={row.ctr >= row.benchmarkCtr ? "good" : "warn"} />
                  <MiniMetric label="Spend" value={money(row.spend)} hint="Current period" tone="default" />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}