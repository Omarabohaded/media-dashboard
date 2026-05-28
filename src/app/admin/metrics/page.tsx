"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AppShell,
  MiniMetric,
  PageLead,
  Section,
  SourcePill,
} from "@/components/AppShell";
import {
  getMetricRegistry,
  getMetricRegistrySummary,
  type MetricRegistryEntry,
} from "@/lib/metricRegistry";

const METRIC_REGISTRY = getMetricRegistry();
const REGISTRY_SUMMARY = getMetricRegistrySummary(METRIC_REGISTRY);

export default function AdminMetricsPage() {
  const [query, setQuery] = useState("");
  const [selectedMetricId, setSelectedMetricId] = useState("total_ad_spend");

  const filteredMetrics = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return METRIC_REGISTRY;
    }

    return METRIC_REGISTRY.filter((metric) =>
      [
        metric.id,
        metric.label,
        metric.category,
        metric.source,
        metric.truthLayer,
        metric.currentFieldBinding,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [query]);

  const selectedMetric =
    filteredMetrics.find((metric) => metric.id === selectedMetricId) ??
    filteredMetrics[0] ??
    METRIC_REGISTRY[0];

  return (
    <AppShell>
      <div className="space-y-5">
        <PageLead
          eyebrow="Admin Metric Registry"
          title="Inspect metric logic before you edit it"
          summary="This workspace brings the current metric workbook, live dashboard bindings, and code-managed rule notes into one place. It is intentionally inspect-first so you can see where a metric comes from, what field it maps to, how it aggregates, and whether it is safe for controlled admin editing later."
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <SourcePill label={`${REGISTRY_SUMMARY.total} documented metrics`} tone="good" />
            <SourcePill
              label={`${REGISTRY_SUMMARY.liveBindings} live bindings`}
              tone="good"
            />
            <SourcePill
              label={`${REGISTRY_SUMMARY.controlledMappings} controlled-edit candidates`}
              tone="warn"
            />
            <SourcePill
              label={`${REGISTRY_SUMMARY.developerManaged} code-managed rules`}
              tone="default"
            />
          </div>
          <Link
            href="/admin"
            className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.68)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Back To Admin
          </Link>
        </div>

        <Section
          title="Registry Coverage"
          subtitle="This first pass focuses on high-confidence inspection: real live bindings where they exist, workbook mappings where execution is still being centralized, and clear flags for metrics that should stay developer-managed."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric
              label="Total Metrics"
              value={`${REGISTRY_SUMMARY.total}`}
              hint="Metrics pulled from the current workbook dictionary."
              tone="good"
            />
            <MiniMetric
              label="Live Bindings"
              value={`${REGISTRY_SUMMARY.liveBindings}`}
              hint="Metrics already tied to real dashboard fields or formulas."
              tone="good"
            />
            <MiniMetric
              label="Partial / Workbook"
              value={`${REGISTRY_SUMMARY.partialBindings + REGISTRY_SUMMARY.documentedOnly}`}
              hint="Metrics that still rely on workbook mapping, proxy logic, or future storefront analytics."
              tone="warn"
            />
            <MiniMetric
              label="Safe Edit Surface"
              value={`${REGISTRY_SUMMARY.controlledMappings}`}
              hint="Best candidates for structured admin overrides after this inspect-first pass."
              tone="warn"
            />
          </div>
        </Section>

        <Section
          title="Metric Catalog"
          subtitle="Search by metric name, ID, source, truth layer, or field binding. Pick a metric to inspect the exact logic that currently exists in this project."
        >
          <div className="grid gap-5 xl:grid-cols-[0.96fr,1.04fr]">
            <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.45)] p-4">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search total_spent, revenue, roas, CPA, store truth..."
                className="w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.82)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
              />

              <div className="mt-4 space-y-3">
                {filteredMetrics.map((metric) => {
                  const isActive = metric.id === selectedMetric.id;
                  return (
                    <button
                      key={metric.id}
                      type="button"
                      onClick={() => setSelectedMetricId(metric.id)}
                      className={`w-full rounded-[22px] border p-4 text-left transition ${
                        isActive
                          ? "border-[var(--accent)] bg-[rgba(161,66,26,0.10)]"
                          : "border-[var(--line)] bg-[rgba(255,255,255,0.58)] hover:border-[var(--accent)]/50"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-[var(--ink)]">
                            {metric.label}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                            {metric.id}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <RegistryPill
                            label={formatBindingStatus(metric.bindingStatus)}
                            tone={getBindingTone(metric.bindingStatus)}
                          />
                          <RegistryPill
                            label={formatEditability(metric.editability)}
                            tone={getEditabilityTone(metric.editability)}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <SourcePill label={metric.category} tone="default" />
                        <SourcePill label={metric.truthLayer} tone="default" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.45)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Selected Metric
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)]">
                    {selectedMetric.label}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <RegistryPill
                      label={formatBindingStatus(selectedMetric.bindingStatus)}
                      tone={getBindingTone(selectedMetric.bindingStatus)}
                    />
                    <RegistryPill
                      label={formatEditability(selectedMetric.editability)}
                      tone={getEditabilityTone(selectedMetric.editability)}
                    />
                    <SourcePill label={selectedMetric.priority} tone="default" />
                    <SourcePill
                      label={selectedMetric.primaryTruth ? "Primary truth" : "Diagnostic"}
                      tone={selectedMetric.primaryTruth ? "good" : "warn"}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-right">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Metric ID
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[var(--ink)]">
                    {selectedMetric.id}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <InspectorCard
                  title="Definition"
                  rows={[
                    { label: "Formula", value: selectedMetric.formula },
                    { label: "Meaning", value: selectedMetric.meaning },
                    { label: "Best paired with", value: selectedMetric.pairing },
                    {
                      label: "Benchmark basis",
                      value: selectedMetric.benchmarkBasis,
                    },
                  ]}
                />
                <InspectorCard
                  title="Mapping"
                  rows={[
                    { label: "Primary source", value: selectedMetric.source },
                    { label: "Truth layer", value: selectedMetric.truthLayer },
                    {
                      label: "Aggregation",
                      value: formatAggregation(selectedMetric.aggregation),
                    },
                    {
                      label: "Current field binding",
                      value: selectedMetric.currentFieldBinding,
                    },
                  ]}
                />
                <InspectorCard
                  title="Execution Notes"
                  rows={[
                    {
                      label: "Live binding note",
                      value: selectedMetric.liveBindingNote,
                    },
                    {
                      label: "Integration note",
                      value:
                        selectedMetric.integrationNote ??
                        "No extra integration note is documented yet.",
                    },
                    {
                      label: "Signal rule",
                      value:
                        selectedMetric.signalRule ??
                        "This metric is not currently defined as a custom signal rule.",
                    },
                  ]}
                />
                <InspectorCard
                  title="Admin Surface"
                  rows={[
                    {
                      label: "Edit recommendation",
                      value: selectedMetric.adminRecommendation,
                    },
                    {
                      label: "Protected reason",
                      value: selectedMetric.protectedReason,
                    },
                  ]}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TagSection
                  title="Raw Fields"
                  items={selectedMetric.rawFields}
                  emptyLabel="No raw field list is documented yet."
                />
                <TagSection
                  title="Derived From"
                  items={selectedMetric.derivedFrom}
                  emptyLabel="This metric is treated as a base metric right now."
                />
                <TagSection
                  title="Where Used"
                  items={selectedMetric.dashboardUsage}
                  emptyLabel="No dashboard usage has been tagged yet."
                />
                <TagSection
                  title="Implementation Locations"
                  items={selectedMetric.implementationLocations}
                  emptyLabel="No implementation location has been tagged yet."
                />
                <TagSection
                  title="Editable Fields"
                  items={selectedMetric.editableFields}
                  emptyLabel="This metric is inspect-only in the current plan."
                />
                <TagSection
                  title="Protected Fields"
                  items={selectedMetric.protectedFields}
                  emptyLabel="No protected fields are listed."
                />
              </div>
            </div>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

function InspectorCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(255,255,255,0.62)] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        {title}
      </div>
      <div className="mt-4 space-y-4">
        {rows.map((row) => (
          <div key={`${title}-${row.label}`}>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              {row.label}
            </div>
            <div className="mt-1 text-sm leading-6 text-[var(--ink)]">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TagSection({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(255,255,255,0.62)] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        {title}
      </div>
      {items.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <SourcePill key={`${title}-${item}`} label={item} tone="default" />
          ))}
        </div>
      ) : (
        <div className="mt-4 text-sm leading-6 text-[var(--muted)]">{emptyLabel}</div>
      )}
    </div>
  );
}

function RegistryPill({
  label,
  tone,
}: {
  label: string;
  tone: "good" | "warn" | "default";
}) {
  return <SourcePill label={label} tone={tone} />;
}

function formatBindingStatus(status: MetricRegistryEntry["bindingStatus"]) {
  if (status === "live") {
    return "Live binding";
  }

  if (status === "partial") {
    return "Partial binding";
  }

  return "Workbook only";
}

function formatEditability(editability: MetricRegistryEntry["editability"]) {
  if (editability === "controlled_mapping") {
    return "Controlled edit";
  }

  if (editability === "developer_managed") {
    return "Code managed";
  }

  return "View only";
}

function formatAggregation(aggregation: MetricRegistryEntry["aggregation"]) {
  if (aggregation === "ratio") {
    return "Ratio / derived formula";
  }

  if (aggregation === "sum") {
    return "Sum / rollup";
  }

  if (aggregation === "count") {
    return "Count / event volume";
  }

  if (aggregation === "share") {
    return "Share of total";
  }

  if (aggregation === "rule") {
    return "Rule-based logic";
  }

  if (aggregation === "average") {
    return "Average";
  }

  return "Not centralized yet";
}

function getBindingTone(status: MetricRegistryEntry["bindingStatus"]) {
  if (status === "live") {
    return "good" as const;
  }

  if (status === "partial") {
    return "warn" as const;
  }

  return "default" as const;
}

function getEditabilityTone(editability: MetricRegistryEntry["editability"]) {
  if (editability === "controlled_mapping") {
    return "warn" as const;
  }

  if (editability === "developer_managed") {
    return "default" as const;
  }

  return "good" as const;
}
