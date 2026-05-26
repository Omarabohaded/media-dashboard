"use client";

import {
  AppShell,
  DisplayValue,
  MiniMetric,
  Section,
  SourcePill,
  StatusPill,
} from "@/components/AppShell";

const topMetrics = [
  ["Store Revenue", "$182.4k", "Website/store truth", "good"],
  ["Orders", "2,194", "Completed purchases", "good"],
  ["Total Ad Spend", "$61.3k", "Real cross-platform spend", "default"],
  ["Real ROAS", "2.98", "Store Revenue / Total Ad Spend", "warn"],
  [
    "Social ROAS",
    "3.34",
    "Attributed platform revenue / ad spend",
    "good",
  ],
  ["MER", "2.98", "Below 30d median by 6.1%", "warn"],
] as const;

const channelRows = [
  ["Meta", "$25.4k", "41.4%", "$91.2k", "3.59", "44.8%", "Stable 7d", "Scale carefully"],
  ["Google", "$18.9k", "30.8%", "$60.4k", "3.19", "29.7%", "Strong 7d", "Protect volume"],
  ["TikTok", "$11.2k", "18.3%", "$31.5k", "2.81", "15.5%", "Weak 7d", "Tighten spend"],
  ["Snap", "$5.8k", "9.5%", "$13.2k", "2.28", "6.0%", "Weak 7d", "Review creative"],
] as const;

const portfolioRows = [
  ["Aster & Pine", "$61.3k", "$182.4k", "2,194", "2.98", "3.34", "Watch gap", "Efficiency softening"],
  ["Loom & Tide", "$48.1k", "$169.7k", "1,925", "3.53", "3.71", "Stable", "Strong"],
  ["North House", "$72.6k", "$207.1k", "2,438", "2.85", "3.02", "Partial", "Weak last 7d"],
  ["Everline", "$38.4k", "$124.3k", "1,611", "3.24", "3.10", "Stable", "Acceptable"],
  ["Vale Studio", "$64.5k", "$241.7k", "2,824", "3.75", "3.88", "Strong", "Scaling well"],
] as const;

const guideEntries = [
  {
    name: "Real ROAS",
    definition: "Store Revenue / Total Ad Spend",
    useItFor: "Final business efficiency reading and owner-level budget decisions.",
    caution:
      "Do not overreact to a single weak day if volume is low or the period is incomplete.",
    actWhen:
      "It is below the 7-day median for 4 to 7 days and confirmed by MER or purchase CVR weakness.",
    related: "MER, Purchase CVR, Tracking Gap",
  },
  {
    name: "Social ROAS",
    definition: "Platform-attributed revenue / Total Ad Spend",
    useItFor: "Channel comparison and platform optimization.",
    caution:
      "Do not treat it as final business truth when attribution inflation is possible.",
    actWhen:
      "Use it to compare channels, then confirm with Real ROAS before making aggressive account-level changes.",
    related: "Real ROAS, Tracking Gap, Revenue Share",
  },
  {
    name: "MER",
    definition: "Store Revenue / Total Ad Spend",
    useItFor: "Top-line blended business health.",
    caution:
      "MER can look weak during heavy scale periods before revenue catches up, so check persistence not just point change.",
    actWhen:
      "Spend rises while MER stays below baseline for several days and funnel metrics also weaken.",
    related: "Real ROAS, AOV, Orders",
  },
  {
    name: "Tracking Gap",
    definition: "Difference between platform truth and website/store truth.",
    useItFor: "Trust calibration before budget or scaling decisions.",
    caution:
      "A moderate gap is normal; a widening trend matters more than a one-off mismatch.",
    actWhen:
      "The gap moves outside its normal range or keeps widening for multiple days.",
    related: "Real ROAS, Social ROAS, Platform Purchases",
  },
] as const;

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <section
          id="command-center"
          className="rounded-[28px] border border-slate-800 bg-[linear-gradient(140deg,rgba(37,99,235,0.16),rgba(2,6,23,0.92))] p-6 shadow-xl shadow-black/20"
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
            Daily operator view
          </p>
          <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
            Revenue is stable, but store-truth efficiency is soft enough to investigate.
          </h2>
          <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300">
            Total ad spend is up 11.8%. Social ROAS still looks healthy, but
            Real ROAS and MER have both trended down for 6 of the last 7 days.
            Confidence is medium-high because the signal is supported by softer
            purchase conversion rate and a mild tracking gap.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <SourcePill label="Decision status: Actionable" tone="warn" />
            <SourcePill label="Confidence: Medium-High" tone="good" />
            <SourcePill
              label="Recommended stance: Hold broad scaling"
              tone="warn"
            />
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {topMetrics.map(([label, value, hint, tone]) => (
            <MiniMetric
              key={label}
              label={label}
              value={value}
              hint={hint}
              tone={tone}
            />
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Section
            title="Top Risks"
            subtitle="Focus the buyer on the highest-signal weaknesses first."
          >
            <InsightCard
              title="Real ROAS below 7-day median"
              detail="Persisting for 6 of the last 7 days, which is enough to investigate rather than ignore as single-day noise."
              status="Actionable"
            />
            <InsightCard
              title="Checkout completion is soft"
              detail="Checkout-to-purchase rate is weak versus same-weekday baseline, which points to friction after demand has already been created."
              status="Watch"
            />
            <InsightCard
              title="TikTok tracking gap is widening"
              detail="Platform-attributed revenue is running ahead of store truth, which lowers confidence for budget expansion decisions there."
              status="Review"
            />
          </Section>

          <Section
            title="Top Opportunities"
            subtitle="Surface where growth is still healthy enough to protect or extend."
          >
            <InsightCard
              title="Meta prospecting remains scalable"
              detail="Frequency is stable, CTR has not cracked, and purchase CVR is holding above its short-term norm."
              status="Scale"
            />
            <InsightCard
              title="Google branded search supports blended efficiency"
              detail="It keeps helping the account absorb weaker social days without damaging order quality."
              status="Protect"
            />
            <InsightCard
              title="AOV is stable while order volume grows"
              detail="Growth quality is still acceptable, so the issue is more likely conversion efficiency than collapsing offer quality."
              status="Stable"
            />
          </Section>
        </div>

        <div id="business-health">
          <Section
            title="Business Health"
            subtitle="Separate business efficiency from platform-reported efficiency."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MiniMetric
                label="Real ROAS"
                value="2.98"
                hint="Best owner-level efficiency truth"
                tone="warn"
              />
              <MiniMetric
                label="Social ROAS"
                value="3.34"
                hint="Best for channel diagnostics"
                tone="good"
              />
              <MiniMetric
                label="Tracking Gap"
                value="+12.1%"
                hint="Platform revenue vs store truth"
                tone="warn"
              />
              <MiniMetric
                label="AOV"
                value="$83.14"
                hint="Revenue quality still stable"
                tone="good"
              />
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <TextPanel
                title="Business interpretation"
                lines={[
                  "Revenue growth is real, but efficiency is not keeping pace with spend growth.",
                  "AOV is stable, so the pressure is more likely conversion-related than offer-related.",
                  "Use Real ROAS and MER to decide budget posture, then use Social ROAS to locate channel winners.",
                ]}
              />
              <StatusPanel
                title="Benchmark status"
                items={[
                  ["Store Revenue", "Strong"],
                  ["Orders", "Acceptable"],
                  ["Real ROAS", "Weak"],
                  ["AOV", "Strong"],
                  ["Purchase CVR", "Weak"],
                ]}
              />
            </div>
          </Section>
        </div>

        <div id="funnel">
          <Section
            title="Funnel"
            subtitle="Check whether the problem is traffic, product interest, or checkout completion."
          >
            <div className="grid gap-4 xl:grid-cols-5">
              <FunnelTile label="Sessions" value="54,200" hint="Acceptable baseline" />
              <FunnelTile label="View Content" value="22,900" hint="42.2% rate" />
              <FunnelTile label="Add to Cart" value="7,340" hint="13.5% rate" />
              <FunnelTile
                label="Begin Checkout"
                value="4,190"
                hint="57.1% from cart"
              />
              <FunnelTile
                label="Purchases"
                value="2,194"
                hint="52.4% from checkout"
                warn
              />
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <TextPanel
                title="Primary read"
                lines={[
                  "Traffic quality is acceptable, and product interest is not collapsing.",
                  "The main weakness is after checkout starts, which suggests friction, payment issues, shipping surprise, or device mismatch rather than a pure top-of-funnel media failure.",
                ]}
              />
              <TextPanel
                title="What to check next"
                lines={[
                  "Checkout-to-purchase rate by device",
                  "Shipping threshold or offer changes in the last 7 days",
                  "Country-level conversion softness versus spend mix",
                  "Payment error logs and checkout speed",
                ]}
              />
            </div>
          </Section>
        </div>

        <div id="channel-breakdown">
          <Section
            title="Channel Breakdown"
            subtitle="Use Social ROAS for platform reading and Real ROAS for final business judgment."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                    <th className="px-3 pb-3">Channel</th>
                    <th className="px-3 pb-3">Spend</th>
                    <th className="px-3 pb-3">Spend Share</th>
                    <th className="px-3 pb-3">Attributed Revenue</th>
                    <th className="px-3 pb-3">Social ROAS</th>
                    <th className="px-3 pb-3">Revenue Share</th>
                    <th className="px-3 pb-3">Trend</th>
                    <th className="px-3 pb-3">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {channelRows.map((row) => (
                    <tr key={row[0]} className="border-b border-slate-800">
                      {row.slice(0, 7).map((cell) => (
                        <td
                          key={cell}
                          className="px-3 py-4 text-sm text-slate-300 first:font-semibold first:text-white"
                        >
                          <DisplayValue value={cell} />
                        </td>
                      ))}
                      <td className="px-3 py-4">
                        <StatusPill status={row[7]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        <div id="scaling" className="grid gap-5 xl:grid-cols-2">
          <Section
            title="Scaling"
            subtitle="State the posture clearly and then explain why."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <MiniMetric
                label="Recommended Posture"
                value="Hold at account level"
                hint="Real ROAS and purchase CVR do not support broad scaling today"
                tone="warn"
              />
              <MiniMetric
                label="Selective Scale"
                value="Meta +8% / Google +5%"
                hint="Only on units above their 30d efficiency band"
                tone="good"
              />
              <MiniMetric
                label="Primary Blockers"
                value="Checkout softness, TikTok gap"
                hint="Resolve before opening wider spend"
                tone="warn"
              />
            </div>
          </Section>

          <div id="actions">
            <Section
              title="Actions"
              subtitle="Rank actions by severity, confidence, and decision value."
            >
              <ActionCard
                priority="Priority 1"
                title="Inspect checkout completion by device and market"
                reason="Checkout-to-purchase rate is below same-weekday norm for 5 of the last 7 days."
                severity="High"
                confidence="Medium-High"
              />
              <ActionCard
                priority="Priority 2"
                title="Tighten TikTok spend until tracking and conversion quality normalize"
                reason="Attributed strength is not confirmed by store-truth efficiency."
                severity="Medium"
                confidence="Medium"
              />
              <ActionCard
                priority="Priority 3"
                title="Keep Meta prospecting live and test one new creative angle"
                reason="Still the best scale candidate, but not wide-open enough for aggressive budget expansion."
                severity="Opportunity"
                confidence="Medium"
              />
            </Section>
          </div>
        </div>

        <div id="portfolio-overview">
          <Section
            title="Portfolio Overview"
            subtitle="Cross-client reporting using store-truth sales and real ad spend."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MiniMetric
                label="Portfolio Ad Spend"
                value="$284.9k"
                hint="All connected platform spend"
              />
              <MiniMetric
                label="Portfolio Sales"
                value="$925.2k"
                hint="Store-truth revenue"
                tone="good"
              />
              <MiniMetric
                label="Portfolio Real ROAS"
                value="3.25"
                hint="Store Revenue / Ad Spend"
                tone="good"
              />
              <MiniMetric
                label="Orders"
                value="10,992"
                hint="Completed website orders"
              />
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                    <th className="px-3 pb-3">Client</th>
                    <th className="px-3 pb-3">Total Ad Spend</th>
                    <th className="px-3 pb-3">Total Sales</th>
                    <th className="px-3 pb-3">Orders</th>
                    <th className="px-3 pb-3">Real ROAS</th>
                    <th className="px-3 pb-3">Social ROAS</th>
                    <th className="px-3 pb-3">Tracking Status</th>
                    <th className="px-3 pb-3">7D Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioRows.map((row) => (
                    <tr key={row[0]} className="border-b border-slate-800">
                      {row.slice(0, 6).map((cell) => (
                        <td
                          key={cell}
                          className="px-3 py-4 text-sm text-slate-300 first:font-semibold first:text-white"
                        >
                          <DisplayValue value={cell} />
                        </td>
                      ))}
                      <td className="px-3 py-4">
                        <StatusPill status={row[6]} />
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-300">
                        {row[7]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        <div id="metric-guide">
          <Section
            title="Metric Guide"
            subtitle="Make the guide feel like a playbook, not a glossary."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              {guideEntries.map((entry) => (
                <article
                  key={entry.name}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
                >
                  <h3 className="text-2xl font-black text-white">{entry.name}</h3>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                    <p>
                      <strong className="text-white">Definition:</strong>{" "}
                      {entry.definition}
                    </p>
                    <p>
                      <strong className="text-white">Use it for:</strong>{" "}
                      {entry.useItFor}
                    </p>
                    <p>
                      <strong className="text-white">
                        When not to overreact:
                      </strong>{" "}
                      {entry.caution}
                    </p>
                    <p>
                      <strong className="text-white">
                        Action is usually needed when:
                      </strong>{" "}
                      {entry.actWhen}
                    </p>
                    <p>
                      <strong className="text-white">Related checks:</strong>{" "}
                      {entry.related}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Section>
        </div>

        <div id="admin">
          <Section
            title="Admin"
            subtitle="Connections, mappings, and trust settings live here."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MiniMetric
                label="Store Connection"
                value="Shopify connected"
                hint="Timezone aligned to store truth"
                tone="good"
              />
              <MiniMetric
                label="Platform Mapping"
                value="Meta, Google, TikTok, Snap"
                hint="All spend sources mapped into blended spend"
                tone="good"
              />
              <MiniMetric
                label="Analytics Layer"
                value="Partial"
                hint="GA4 needed for full funnel truth"
                tone="warn"
              />
              <MiniMetric
                label="Sync Health"
                value="Live / Partial mix"
                hint="Flag partial connectors before trusting recommendations"
                tone="warn"
              />
            </div>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

function InsightCard({
  title,
  detail,
  status,
}: {
  title: string;
  detail: string;
  status: string;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 last:mb-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
        </div>
        <StatusPill status={status} />
      </div>
    </div>
  );
}

function TextPanel({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function StatusPanel({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.map(([label, status]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3"
          >
            <span className="text-sm font-semibold text-white">{label}</span>
            <StatusPill status={status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelTile({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: string;
  hint: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-800 p-5 ${
        warn ? "bg-amber-950/20" : "bg-slate-950/40"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <div className="mt-3 text-3xl font-black text-white">{value}</div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{hint}</p>
    </div>
  );
}

function ActionCard({
  priority,
  title,
  reason,
  severity,
  confidence,
}: {
  priority: string;
  title: string;
  reason: string;
  severity: string;
  confidence: string;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 last:mb-0">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3">
            <StatusPill status={priority} />
          </div>
          <h3 className="text-xl font-black text-white">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-300">{reason}</p>
        </div>
        <div className="grid gap-2 text-sm text-slate-400 xl:text-right">
          <span>Severity: {severity}</span>
          <span>Confidence: {confidence}</span>
        </div>
      </div>
    </div>
  );
}
