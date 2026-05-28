"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AppShell,
  MiniMetric,
  PageLead,
  Section,
  SourcePill,
} from "@/components/AppShell";
import type {
  MetricAdminOverride,
  MetricBenchmarkDirection,
  MetricChannel,
  MetricDenominatorChoice,
  MetricRegistryEntry,
  MetricRevenueBasis,
} from "@/lib/metricRegistry";

type MetricRegistryResponse = {
  entries: MetricRegistryEntry[];
  summary: {
    total: number;
    liveBindings: number;
    partialBindings: number;
    documentedOnly: number;
    controlledMappings: number;
    developerManaged: number;
    viewOnly: number;
    activeOverrides: number;
  };
  storage: {
    storageMode: "vercel_kv" | "ephemeral_tmp";
    location: string;
    durable: boolean;
  };
};

type MetricOverrideDraft = {
  revenueBasis: MetricRevenueBasis | "";
  denominatorChoice: MetricDenominatorChoice | "";
  includedChannels: MetricChannel[];
  benchmarkDirection: MetricBenchmarkDirection | "";
  benchmarkGood: string;
  benchmarkWatch: string;
  benchmarkRisk: string;
  adminNotes: string;
};

const EMPTY_SUMMARY: MetricRegistryResponse["summary"] = {
  total: 0,
  liveBindings: 0,
  partialBindings: 0,
  documentedOnly: 0,
  controlledMappings: 0,
  developerManaged: 0,
  viewOnly: 0,
  activeOverrides: 0,
};

export default function AdminMetricsPage() {
  const [entries, setEntries] = useState<MetricRegistryEntry[]>([]);
  const [summary, setSummary] = useState<MetricRegistryResponse["summary"]>(
    EMPTY_SUMMARY
  );
  const [storage, setStorage] = useState<MetricRegistryResponse["storage"] | null>(
    null
  );
  const [query, setQuery] = useState("");
  const [showEditableOnly, setShowEditableOnly] = useState(false);
  const [selectedMetricId, setSelectedMetricId] = useState("total_ad_spend");
  const [draft, setDraft] = useState<MetricOverrideDraft>(buildOverrideDraft(null));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  async function loadRegistry(preferredMetricId?: string) {
    setIsLoading(true);
    setErrorMessage(null);

    const response = await fetch("/api/admin/metrics", { cache: "no-store" });
    const payload = (await response.json()) as MetricRegistryResponse & {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not load the metric registry.");
    }

    setEntries(payload.entries);
    setSummary(payload.summary);
    setStorage(payload.storage);

    const nextMetricId =
      preferredMetricId && payload.entries.some((entry) => entry.id === preferredMetricId)
        ? preferredMetricId
        : payload.entries[0]?.id ?? "";

    setSelectedMetricId(nextMetricId);
  }

  useEffect(() => {
    void loadRegistry(selectedMetricId)
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load the metric registry."
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredMetrics = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return entries.filter((metric) => {
      if (showEditableOnly && metric.editability !== "controlled_mapping") {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        metric.id,
        metric.label,
        metric.category,
        metric.source,
        metric.truthLayer,
        metric.currentFieldBinding,
        metric.editableFields.join(" "),
        metric.adminOverrideSummary.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [entries, query, showEditableOnly]);

  const selectedMetric =
    filteredMetrics.find((metric) => metric.id === selectedMetricId) ??
    entries.find((metric) => metric.id === selectedMetricId) ??
    filteredMetrics[0] ??
    entries[0] ??
    null;

  useEffect(() => {
    setDraft(buildOverrideDraft(selectedMetric?.adminOverride ?? null));
  }, [selectedMetric?.id, selectedMetric?.adminOverride]);

  async function handleSaveOverride() {
    if (!selectedMetric) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/admin/metrics", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metricId: selectedMetric.id,
          revenueBasis: draft.revenueBasis || null,
          denominatorChoice: draft.denominatorChoice || null,
          includedChannels: draft.includedChannels,
          benchmarkDirection: draft.benchmarkDirection || null,
          benchmarkGood: parseDraftNumber(draft.benchmarkGood),
          benchmarkWatch: parseDraftNumber(draft.benchmarkWatch),
          benchmarkRisk: parseDraftNumber(draft.benchmarkRisk),
          adminNotes: draft.adminNotes.trim() || null,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        entry?: MetricRegistryEntry | null;
        summary?: MetricRegistryResponse["summary"];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save the metric override.");
      }

      if (payload.entry) {
        setEntries((current) =>
          current.map((entry) => (entry.id === payload.entry?.id ? payload.entry : entry))
        );
      }

      if (payload.summary) {
        setSummary(payload.summary);
      }

      setStatusMessage(`${selectedMetric.label} override saved.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save the metric override."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResetOverride() {
    if (!selectedMetric) {
      return;
    }

    setIsResetting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch(
        `/api/admin/metrics?metricId=${encodeURIComponent(selectedMetric.id)}`,
        {
          method: "DELETE",
        }
      );
      const payload = (await response.json()) as {
        error?: string;
        entry?: MetricRegistryEntry | null;
        summary?: MetricRegistryResponse["summary"];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not reset the metric override.");
      }

      if (payload.entry) {
        setEntries((current) =>
          current.map((entry) => (entry.id === payload.entry?.id ? payload.entry : entry))
        );
        setDraft(buildOverrideDraft(payload.entry.adminOverride));
      }

      if (payload.summary) {
        setSummary(payload.summary);
      }

      setStatusMessage(`${selectedMetric.label} override cleared.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not reset the metric override."
      );
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageLead
          eyebrow="Admin Metric Registry"
          title="Inspect metric logic and edit the safe layer"
          summary="This workspace now gives you a scan-first registry table for metric management. Use it to see which metrics are editable, what they currently map to, whether an override already exists, and jump straight into the controlled edit panel below."
        />

        <StorageNotice storage={storage} />
        <InlineNotice message={errorMessage} tone="warn" />
        <InlineNotice message={statusMessage} tone="good" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <SourcePill label={`${summary.total} documented metrics`} tone="good" />
            <SourcePill label={`${summary.liveBindings} live bindings`} tone="good" />
            <SourcePill
              label={`${summary.controlledMappings} controlled-edit candidates`}
              tone="warn"
            />
            <SourcePill label={`${summary.activeOverrides} saved overrides`} tone="warn" />
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
          subtitle="This stays tightly scoped to metric logic management. The table below is the new scan-and-edit surface for admins, while the inspector keeps the detailed logic view intact."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric
              label="Total Metrics"
              value={`${summary.total}`}
              hint="Metrics pulled from the current workbook dictionary."
              tone="good"
            />
            <MiniMetric
              label="Live Bindings"
              value={`${summary.liveBindings}`}
              hint="Metrics already tied to real dashboard fields or formulas."
              tone="good"
            />
            <MiniMetric
              label="Safe Edit Surface"
              value={`${summary.controlledMappings}`}
              hint="Metrics that support structured admin overrides."
              tone="warn"
            />
            <MiniMetric
              label="Active Overrides"
              value={`${summary.activeOverrides}`}
              hint="Saved admin adjustments across the registry."
              tone={summary.activeOverrides ? "warn" : "good"}
            />
          </div>
        </Section>

        <Section
          title="Editable Metric Table"
          subtitle="This is the scan-first admin table. Start here to see what can actually be changed, what is already overridden, and what each metric currently points to."
        >
          <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.45)] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search total_spent, revenue, roas, CPA, store truth..."
                  className="w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.82)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                />
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm font-medium text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={showEditableOnly}
                  onChange={(event) => setShowEditableOnly(event.target.checked)}
                />
                <span>Show editable metrics only</span>
              </label>
            </div>

            <div className="mt-4 overflow-x-auto rounded-[20px] border border-[var(--line)] bg-[rgba(255,255,255,0.62)]">
              <table className="min-w-[1180px] w-full border-collapse text-left">
                <thead className="bg-[rgba(249,246,239,0.92)] text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Metric</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                    <th className="px-4 py-4 font-semibold">Current Mapping</th>
                    <th className="px-4 py-4 font-semibold">Editable Surface</th>
                    <th className="px-4 py-4 font-semibold">Saved Override</th>
                    <th className="px-4 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-[var(--muted)]">
                        Loading the metric registry...
                      </td>
                    </tr>
                  ) : filteredMetrics.length ? (
                    filteredMetrics.map((metric) => {
                      const isActive = metric.id === selectedMetric?.id;
                      return (
                        <tr
                          key={metric.id}
                          className={`border-t border-[var(--line)] align-top transition ${
                            isActive ? "bg-[rgba(161,66,26,0.08)]" : "bg-transparent"
                          }`}
                        >
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMetricId(metric.id);
                                setStatusMessage(null);
                                setErrorMessage(null);
                              }}
                              className="text-left"
                            >
                              <div className="text-sm font-semibold text-[var(--ink)]">
                                {metric.label}
                              </div>
                              <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                                {metric.id}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <SourcePill label={metric.category} tone="default" />
                                <SourcePill label={metric.truthLayer} tone="default" />
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-4">
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
                          </td>
                          <td className="px-4 py-4">
                            <div className="max-w-[360px] text-sm leading-6 text-[var(--ink)]">
                              {metric.currentFieldBinding}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {metric.editableFields.length ? (
                              <div className="flex max-w-[280px] flex-wrap gap-2">
                                {metric.editableFields.map((field) => (
                                  <SourcePill
                                    key={`${metric.id}-${field}`}
                                    label={field}
                                    tone="warn"
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-[var(--muted)]">
                                Inspect only
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {metric.adminOverrideSummary.length ? (
                              <div className="max-w-[280px] space-y-2">
                                {metric.adminOverrideSummary.slice(0, 3).map((item) => (
                                  <div
                                    key={`${metric.id}-${item}`}
                                    className="rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-950"
                                  >
                                    {item}
                                  </div>
                                ))}
                                {metric.adminOverrideSummary.length > 3 ? (
                                  <div className="text-xs font-medium text-[var(--muted)]">
                                    +{metric.adminOverrideSummary.length - 3} more details in inspector
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <div className="text-sm text-[var(--muted)]">
                                No saved override
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMetricId(metric.id);
                                setStatusMessage(null);
                                setErrorMessage(null);
                              }}
                              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                                metric.editability === "controlled_mapping"
                                  ? "bg-[var(--accent)] text-white hover:opacity-90"
                                  : "border border-[var(--line)] bg-[rgba(255,255,255,0.78)] text-[var(--ink)] hover:border-[var(--accent)]"
                              }`}
                            >
                              {metric.editability === "controlled_mapping"
                                ? isActive
                                  ? "Editing Below"
                                  : "Edit Metric"
                                : isActive
                                  ? "Inspecting Below"
                                  : "Inspect Metric"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-[var(--muted)]">
                        No metrics matched that search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section
          title="Selected Metric"
          subtitle="Use the inspector for the detailed logic view, then make the structured edit in the controlled admin card when the metric supports it."
        >
          <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.45)] p-4">
            {selectedMetric ? (
              <>
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
                    title="Saved Overrides"
                    items={selectedMetric.adminOverrideSummary}
                    emptyLabel="No admin override is saved for this metric yet."
                  />
                  <TagSection
                    title="Editable Fields"
                    items={selectedMetric.editableFields}
                    emptyLabel="This metric is inspect-only in the current plan."
                  />
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
                    title="Protected Fields"
                    items={selectedMetric.protectedFields}
                    emptyLabel="No protected fields are listed."
                  />
                </div>

                <MetricControlCard
                  metric={selectedMetric}
                  draft={draft}
                  onDraftChange={setDraft}
                  onSave={() => void handleSaveOverride()}
                  onReset={() => void handleResetOverride()}
                  isSaving={isSaving}
                  isResetting={isResetting}
                />
              </>
            ) : (
              <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(255,255,255,0.62)] p-4 text-sm text-[var(--muted)]">
                Pick a metric from the table above to inspect it.
              </div>
            )}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

function MetricControlCard({
  metric,
  draft,
  onDraftChange,
  onSave,
  onReset,
  isSaving,
  isResetting,
}: {
  metric: MetricRegistryEntry;
  draft: MetricOverrideDraft;
  onDraftChange: (draft: MetricOverrideDraft) => void;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  isResetting: boolean;
}) {
  const hasControls =
    metric.editability === "controlled_mapping" &&
    (metric.controlOptions.revenueBasisOptions.length > 0 ||
      metric.controlOptions.denominatorOptions.length > 0 ||
      metric.controlOptions.channelOptions.length > 0 ||
      metric.controlOptions.benchmarkEnabled);

  return (
    <div className="mt-4 rounded-[22px] border border-[var(--line)] bg-[rgba(255,255,255,0.62)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Controlled Admin Edit
          </div>
          <div className="mt-2 text-lg font-semibold text-[var(--ink)]">
            {hasControls
              ? "Adjust the safe mapping layer"
              : "This metric stays inspect-first"}
          </div>
        </div>
        {metric.adminOverride?.updatedAt ? (
          <div className="text-xs text-[var(--muted)]">
            Last saved {new Date(metric.adminOverride.updatedAt).toLocaleString()}
          </div>
        ) : null}
      </div>

      {hasControls ? (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {metric.controlOptions.revenueBasisOptions.length ? (
              <FieldBlock label="Revenue Basis">
                <select
                  value={draft.revenueBasis}
                  onChange={(event) =>
                    onDraftChange({
                      ...draft,
                      revenueBasis: event.target.value as MetricRevenueBasis | "",
                    })
                  }
                  className="w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.88)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
                >
                  <option value="">Use code default</option>
                  {metric.controlOptions.revenueBasisOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldBlock>
            ) : null}

            {metric.controlOptions.denominatorOptions.length ? (
              <FieldBlock label="Denominator Choice">
                <select
                  value={draft.denominatorChoice}
                  onChange={(event) =>
                    onDraftChange({
                      ...draft,
                      denominatorChoice: event.target.value as
                        | MetricDenominatorChoice
                        | "",
                    })
                  }
                  className="w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.88)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
                >
                  <option value="">Use code default</option>
                  {metric.controlOptions.denominatorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldBlock>
            ) : null}
          </div>

          {metric.controlOptions.channelOptions.length ? (
            <FieldBlock label="Included Channels">
              <div className="mt-1 flex flex-wrap gap-3">
                {metric.controlOptions.channelOptions.map((option) => {
                  const checked = draft.includedChannels.includes(
                    option.value as MetricChannel
                  );
                  return (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.78)] px-4 py-3 text-sm text-[var(--ink)]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const nextChannels = event.target.checked
                            ? [...draft.includedChannels, option.value as MetricChannel]
                            : draft.includedChannels.filter(
                                (channel) => channel !== option.value
                              );
                          onDraftChange({
                            ...draft,
                            includedChannels: sortChannels(nextChannels),
                          });
                        }}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </FieldBlock>
          ) : null}

          {metric.controlOptions.benchmarkEnabled ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FieldBlock label="Benchmark Direction">
                <select
                  value={draft.benchmarkDirection}
                  onChange={(event) =>
                    onDraftChange({
                      ...draft,
                      benchmarkDirection: event.target.value as
                        | MetricBenchmarkDirection
                        | "",
                    })
                  }
                  className="w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.88)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
                >
                  <option value="">Use code default</option>
                  <option value="higher_is_better">Higher is better</option>
                  <option value="lower_is_better">Lower is better</option>
                </select>
              </FieldBlock>
              <div className="grid gap-3 sm:grid-cols-3">
                <FieldBlock label="Good">
                  <input
                    value={draft.benchmarkGood}
                    onChange={(event) =>
                      onDraftChange({ ...draft, benchmarkGood: event.target.value })
                    }
                    placeholder="e.g. 3"
                    className="w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.88)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                  />
                </FieldBlock>
                <FieldBlock label="Watch">
                  <input
                    value={draft.benchmarkWatch}
                    onChange={(event) =>
                      onDraftChange({ ...draft, benchmarkWatch: event.target.value })
                    }
                    placeholder="e.g. 2"
                    className="w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.88)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                  />
                </FieldBlock>
                <FieldBlock label="Risk">
                  <input
                    value={draft.benchmarkRisk}
                    onChange={(event) =>
                      onDraftChange({ ...draft, benchmarkRisk: event.target.value })
                    }
                    placeholder="e.g. 1"
                    className="w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.88)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                  />
                </FieldBlock>
              </div>
            </div>
          ) : null}

          <FieldBlock label="Admin Notes">
            <textarea
              value={draft.adminNotes}
              onChange={(event) =>
                onDraftChange({ ...draft, adminNotes: event.target.value })
              }
              rows={4}
              placeholder="Document why this metric uses this mapping for your team."
              className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.88)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
            />
          </FieldBlock>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Override"}
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={isResetting}
              className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.78)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResetting ? "Clearing..." : "Reset To Code Default"}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4 text-sm leading-6 text-[var(--muted)]">
          This metric can be inspected here, but its executable logic should remain in code until the dashboard has a stronger rules engine or a more centralized live binding.
        </div>
      )}
    </div>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-2">{children}</div>
    </div>
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

function InlineNotice({
  message,
  tone,
}: {
  message: string | null;
  tone: "good" | "warn";
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`rounded-[22px] border px-4 py-3 text-sm ${
        tone === "good"
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-amber-300 bg-amber-50 text-amber-900"
      }`}
    >
      {message}
    </div>
  );
}

function StorageNotice({ storage }: { storage: MetricRegistryResponse["storage"] | null }) {
  if (!storage) {
    return null;
  }

  return (
    <div
      className={`rounded-[22px] border px-4 py-3 text-sm ${
        storage.durable
          ? "border-cyan-300 bg-cyan-50 text-cyan-950"
          : "border-amber-300 bg-amber-50 text-amber-950"
      }`}
    >
      {storage.durable
        ? `Metric override storage is durable through ${storage.location}. Saved admin controls should persist across refreshes and deployments.`
        : `Metric override storage is temporary right now through ${storage.location}. Saved edits can reset after refreshes or deployments until durable storage is configured.`}
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

function buildOverrideDraft(override: MetricAdminOverride | null): MetricOverrideDraft {
  return {
    revenueBasis: override?.revenueBasis ?? "",
    denominatorChoice: override?.denominatorChoice ?? "",
    includedChannels: sortChannels(override?.includedChannels ?? []),
    benchmarkDirection: override?.benchmarkDirection ?? "",
    benchmarkGood: stringifyDraftNumber(override?.benchmarkGood ?? null),
    benchmarkWatch: stringifyDraftNumber(override?.benchmarkWatch ?? null),
    benchmarkRisk: stringifyDraftNumber(override?.benchmarkRisk ?? null),
    adminNotes: override?.adminNotes ?? "",
  };
}

function stringifyDraftNumber(value: number | null) {
  return value === null ? "" : `${value}`;
}

function parseDraftNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function sortChannels(channels: MetricChannel[]) {
  return [...channels].sort();
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
