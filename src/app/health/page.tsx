"use client";

import { AppShell, MiniMetric, Section } from "@/components/AppShell";
import { money, num, pct, platformRows, signed, storeTruth } from "@/lib/mockData";

export default function HealthPage() {
  const totalSpend = platformRows.reduce((s, r) => s + r.spend, 0);
  const prevSpend = platformRows.reduce((s, r) => s + r.prevSpend, 0);
  const mer = storeTruth.storeSales / totalSpend;
  const prevMer = storeTruth.prevStoreSales / prevSpend;
  const cpa = totalSpend / storeTruth.orders;
  const prevCpa = prevSpend / storeTruth.prevOrders;
  const purchaseCvr = storeTruth.orders / storeTruth.sessions;

  return (
    <AppShell>
      <div className="space-y-5">
        <Section title="Business Health" subtitle="The business truth layer. This is where we decide whether the account is actually healthy.">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric label="Store Sales" value={money(storeTruth.storeSales)} hint={`${signed(pct(storeTruth.storeSales, storeTruth.prevStoreSales))} vs previous`} tone="good" />
            <MiniMetric label="MER" value={`${num(mer, 2)}x`} hint={`${signed(pct(mer, prevMer))} vs previous`} tone={mer >= prevMer ? "good" : "warn"} />
            <MiniMetric label="Orders" value={num(storeTruth.orders)} hint={`${signed(pct(storeTruth.orders, storeTruth.prevOrders))} vs previous`} tone="good" />
            <MiniMetric label="AOV" value={money(storeTruth.aov)} hint={`${signed(pct(storeTruth.aov, storeTruth.prevAov))} vs previous`} tone="good" />
            <MiniMetric label="Total Spend" value={money(totalSpend)} hint={`${signed(pct(totalSpend, prevSpend))} vs previous`} tone="warn" />
            <MiniMetric label="CPA / CAC" value={money(cpa)} hint={`${signed(pct(cpa, prevCpa))} vs previous`} tone={cpa <= prevCpa ? "good" : "warn"} />
            <MiniMetric label="Purchase CVR" value={`${num(purchaseCvr * 100, 2)}%`} hint="Website/store truth" tone="good" />
            <MiniMetric label="Store Sales Formula" value="Sales + VAT + Shipping" hint="When available from website/store" tone="default" />
          </div>
        </Section>

        <Section title="Health Interpretation" subtitle="What a performance scaler should understand first.">
          <div className="grid gap-5 md:grid-cols-3">
            <MiniMetric label="Main Read" value="Healthy but watch MER" hint="Sales are growing, but spend pressure exists." tone="warn" />
            <MiniMetric label="Priority" value="Protect efficiency" hint="Do not scale every platform equally." tone="warn" />
            <MiniMetric label="Next Check" value="Weak channels" hint="Google and TikTok need review." tone="bad" />
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
