"use client";

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
  getCpaDenominatorLabel,
  getEffectiveCpaCac,
} from "@/lib/dashboardMetricLogic";
import { useDashboardReadiness } from "@/lib/useDashboardReadiness";

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

function formatPercent(value: number, digits = 1) {
  return `${formatNumber(value, digits)}%`;
}

export default function PaidMediaPage() {
  const {
    activeClient,
    isLoading,
    metaPreview,
    paidMediaReport,
    metaStatus,
    storePreview,
    metricLogic,
  } = useDashboardReadiness();

  const hasMeta = Boolean(metaPreview && metaStatus?.selectedAccountId);
  const hasPaidMedia = Boolean(paidMediaReport?.rows.length);
  const currency = metaStatus?.selectedAccount?.currency ?? "USD";
  const blended = paidMediaReport?.blended;
  const spend = blended?.spend ?? 0;
  const revenue = blended?.purchaseValue ?? 0;
  const ctr = blended?.ctr ?? null;
  const cpc = blended?.cpc ?? null;
  const cpm = blended?.cpm ?? null;
  const roas = blended?.roas ?? null;
  const cpaCac = getEffectiveCpaCac(metaPreview, storePreview, metricLogic);
  const cpaDenominatorLabel = getCpaDenominatorLabel(
    cpaCac.appliedDenominator as Parameters<typeof getCpaDenominatorLabel>[0]
  );
  const sortedRows = [...(paidMediaReport?.rows ?? [])].sort((a, b) => b.spend - a.spend);
  const avgFrequency = null;

  const summary = !hasPaidMedia
    ? "This paid media page now has its own route and data surface, but it stays empty until a paid-media account is connected."
    : "This page is now the dedicated media workspace. Use it for campaign-level delivery, cost, and efficiency reads instead of hunting through sections on the homepage.";

  if (isLoading) {
    return (
      <AppShell>
        <DashboardLoadingState
          title="Loading paid media analysis"
          description="Pulling campaign-level spend, delivery, and conversion signals for the active client."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageLead
          eyebrow="Paid Media"
          title={activeClient ? `${activeClient.name} paid media analysis` : "Paid media analysis"}
          summary={summary}
        />

        <div className="flex flex-wrap gap-2">
          <SourcePill
            label={hasMeta ? "Meta live" : "Meta missing"}
            tone={hasMeta ? "good" : "warn"}
          />
          <SourcePill
            label={paidMediaReport?.channels.some((channel) => channel.sourceType === "tiktok") ? "TikTok included" : "TikTok awaiting connection"}
            tone={paidMediaReport?.channels.some((channel) => channel.sourceType === "tiktok") ? "good" : "warn"}
          />
          <SourcePill
            label={`CPA / CAC uses ${cpaDenominatorLabel}`}
            tone={cpaCac.blockedReason ? "warn" : "default"}
          />
          <SourcePill label="Google pending" tone="default" />
          <SourcePill label="Snap pending" tone="default" />
        </div>

        {!hasPaidMedia ? (
          <EmptySectionState
            title="No paid-media source is connected yet"
            description="This tab is ready for its own deeper analysis, but it needs a saved paid-media account in Admin before campaign-level numbers can appear here."
            bullets={[
              `Active client: ${activeClient?.name ?? "No client selected"}`,
              "Connect Meta in Admin and save the correct ad account to this client.",
              "Once connected, this page becomes the dedicated home for spend, CTR, CPC, CPM, ROAS, and campaign reads.",
            ]}
          />
        ) : null}

        <Section
          title="Paid Media Snapshot"
          subtitle="These metrics are resolved through the central metric mapping layer where supported."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            <MiniMetric
              label="Spend"
              value={hasPaidMedia ? formatMoney(spend, currency) : "Waiting"}
              hint="Connected account spend"
              tone={hasPaidMedia ? "good" : "warn"}
            />
            <MiniMetric
              label="Attributed Revenue"
              value={hasPaidMedia ? formatMoney(revenue, currency) : "Waiting"}
              hint="Platform-attributed value"
              tone={hasPaidMedia ? "good" : "warn"}
            />
            <MiniMetric
              label="ROAS"
              value={roas !== null ? `${formatNumber(roas, 2)}x` : "Waiting"}
              hint="Resolved attributed revenue divided by spend"
              tone={roas !== null ? "good" : "warn"}
            />
            <MiniMetric
              label="CPA / CAC"
              value={cpaCac.value !== null ? formatMoney(cpaCac.value, currency) : "Blocked"}
              hint={
                cpaCac.blockedReason ??
                `${cpaDenominatorLabel} denominator`
              }
              tone={cpaCac.value !== null ? "good" : "warn"}
            />
            <MiniMetric
              label="CTR"
              value={ctr !== null ? formatPercent(ctr) : "Waiting"}
              hint="Resolved clicks divided by impressions"
              tone={ctr !== null ? "good" : "warn"}
            />
            <MiniMetric
              label="CPC"
              value={cpc !== null ? formatMoney(cpc, currency) : "Waiting"}
              hint="Resolved spend divided by clicks"
              tone={cpc !== null ? "good" : "warn"}
            />
            <MiniMetric
              label="CPM"
              value={cpm !== null ? formatMoney(cpm, currency) : "Waiting"}
              hint="Resolved spend per thousand impressions"
              tone={cpm !== null ? "good" : "warn"}
            />
          </div>
        </Section>

        <Section
          title="Channel vs blended totals"
          subtitle="Each channel is shown separately; the snapshot above is the one blended total after included-channel rules are applied."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(paidMediaReport?.channels ?? []).map((channel) => (
              <div key={channel.sourceType} className="rounded-2xl border border-[var(--line)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {channel.sourceType === "meta" ? "Meta" : "TikTok"}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  {formatMoney(channel.spend, currency)}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {typeof channel.roas === "number" ? `${formatNumber(channel.roas, 2)}x ROAS` : "ROAS unavailable"}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Mapping: {channel.mappingStatuses.join(", ") || "no rows"}
                </p>
              </div>
            ))}
            {(paidMediaReport?.issues ?? []).map((issue) => (
              <div key={`${issue.sourceType}:${issue.message}`} className="rounded-2xl border border-[var(--line)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {issue.sourceType}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{issue.message}</p>
              </div>
            ))}
          </div>
        </Section>

        <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
          <Section
            title="Campaign Table"
            subtitle="Campaign rows still show row-level media values from the connected platform preview."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[var(--line)] text-left text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                    <th className="px-3 pb-3">Campaign</th>
                    <th className="px-3 pb-3">Channel</th>
                    <th className="px-3 pb-3">Spend</th>
                    <th className="px-3 pb-3">Purchases</th>
                    <th className="px-3 pb-3">Revenue</th>
                    <th className="px-3 pb-3">CTR</th>
                    <th className="px-3 pb-3">CPC</th>
                    <th className="px-3 pb-3">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => {
                    return (
                      <tr key={`${row.sourceType}:${row.sourceRecordId ?? row.sourceRecordName}`} className="border-b border-[var(--line)]">
                        <td className="px-3 py-4 text-sm font-semibold text-[var(--ink)]">
                          {row.sourceRecordName ?? row.sourceRecordId ?? "Unnamed campaign"}
                        </td>
                        <td className="px-3 py-4 text-sm text-[var(--muted)]">
                          {row.sourceType === "meta" ? "Meta" : "TikTok"}
                        </td>
                        <td className="px-3 py-4 text-sm text-[var(--muted)]">
                          {formatMoney(row.spend, currency)}
                        </td>
                        <td className="px-3 py-4 text-sm text-[var(--muted)]">
                          {formatNumber(row.purchases)}
                        </td>
                        <td className="px-3 py-4 text-sm text-[var(--muted)]">
                          {formatMoney(row.purchaseValue, currency)}
                        </td>
                        <td className="px-3 py-4 text-sm text-[var(--muted)]">
                          {typeof row.ctr === "number" ? formatPercent(row.ctr) : "-"}
                        </td>
                        <td className="px-3 py-4 text-sm text-[var(--muted)]">
                          {typeof row.cpc === "number" ? formatMoney(row.cpc, currency) : "-"}
                        </td>
                        <td className="px-3 py-4 text-sm text-[var(--muted)]">
                          {typeof row.roas === "number" ? `${formatNumber(row.roas, 2)}x` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            title="Media Read"
            subtitle="Quick interpretation before you move into budget actions."
          >
            <div className="space-y-4">
              <ReadCard
                title="Delivery quality"
                status={ctr !== null && ctr < 1 ? "Watch" : "Stable"}
                detail={
                  ctr !== null
                    ? `CTR is ${formatPercent(ctr)} and average frequency is ${avgFrequency !== null ? formatNumber(avgFrequency, 2) : "not ready"}. Use these together to spot audience saturation and creative fatigue.`
                    : "Delivery quality is not readable yet."
                }
              />
              <ReadCard
                title="Cost pressure"
                status={cpm !== null && cpm > 25 ? "Watch" : "Stable"}
                detail={
                  cpm !== null && cpc !== null
                    ? `CPM is ${formatMoney(cpm, currency)} and CPC is ${formatMoney(cpc, currency)}. Rising CPM with weak CTR usually points to auction pressure plus softer creative response.`
                    : "Cost pressure is not readable yet."
                }
              />
              <ReadCard
                title="Efficiency"
                status={roas !== null && roas < 2 ? "Actionable" : "Stable"}
                detail={
                  roas !== null
                    ? `ROAS is ${formatNumber(roas, 2)}x on this connected account. Use Business Health before making big spend calls, because final truth still belongs to store revenue and MER.`
                    : "Efficiency is not readable yet."
                }
              />
            </div>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

function ReadCard({
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
