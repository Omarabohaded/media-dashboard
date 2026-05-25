"use client";

import { AppShell, MiniMetric, Section, StatusPill } from "@/components/AppShell";
import { money, num, platformRows } from "@/lib/mockData";
import { evaluateScaling } from "@/lib/scalingEngine";

export default function ScalingPage() {
  const scalingDecision = evaluateScaling({
  merStatus: "danger",
  merTrend: "declining",
  hasCreativeFatigue: true,
  revenueGrowth: 10,
  spendGrowth: 25,
  priorityScore: 69,
});
  return (
    <AppShell>
      <div className="space-y-5">
        <Section title="Scaling Engine" subtitle="Can we increase spend safely? This is the main page for performance marketers/scalers.">
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-500 bg-cyan-950/20 p-5">
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
