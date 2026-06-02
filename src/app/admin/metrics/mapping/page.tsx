"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageLead, Section, SourcePill } from "@/components/AppShell";
import type { MetricRegistryEntry } from "@/lib/metricRegistry";
import type {
  MetricFormulaTemplate,
  MetricMappingAggregation,
  MetricMappingFilterPreset,
  MetricMappingOverride,
  MetricMappingSourceField,
  MetricMappingSourceType,
} from "@/lib/metricMappingStore";

type MappingEntry = {
  metric: MetricRegistryEntry;
  mapping: MetricMappingOverride;
  hasSavedMapping: boolean;
  canEditMapping: boolean;
};

type MappingResponse = {
  entries: MappingEntry[];
  summary: {
    total: number;
    liveBindings: number;
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
  error?: string;
};

type MappingDraft = {
  sourceType: MetricMappingSourceType;
  sourceField: MetricMappingSourceField;
  aggregation: MetricMappingAggregation;
  filterPreset: MetricMappingFilterPreset;
  formulaTemplate: MetricFormulaTemplate;
  enabled: boolean;
  adminNotes: string;
};

const sourceTypeOptions: Array<{ value: MetricMappingSourceType; label: string }> = [
  { value: "woocommerce", label: "WooCommerce" },
  { value: "shopify", label: "Shopify" },
  { value: "meta", label: "Meta" },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok" },
  { value: "snap", label: "Snapchat" },
  { value: "calculated", label: "Calculated" },
  { value: "manual", label: "Manual" },
  { value: "not_connected", label: "Not connected" },
];

const sourceFieldOptions: Array<{ value: MetricMappingSourceField; label: string }> = [
  { value: "grossSales", label: "Gross Sales" },
  { value: "netSales", label: "Net Sales" },
  { value: "ordersCount", label: "Orders Count" },
  { value: "averageOrderValue", label: "Average Order Value" },
  { value: "taxTotal", label: "Tax Total" },
  { value: "shippingTotal", label: "Shipping Total" },
  { value: "totalAdSpend", label: "Total Ad Spend" },
  { value: "platformPurchaseValue", label: "Platform Purchase Value" },
  { value: "purchases", label: "Purchases" },
  { value: "clicks", label: "Clicks" },
  { value: "impressions", label: "Impressions" },
  { value: "ctr", label: "CTR" },
  { value: "cpc", label: "CPC" },
  { value: "cpm", label: "CPM" },
  { value: "frequency", label: "Frequency" },
  { value: "reach", label: "Reach" },
  { value: "addToCart", label: "Add To Cart" },
  { value: "checkoutInitiated", label: "Checkout Initiated" },
  { value: "newCustomers", label: "New Customers" },
  { value: "sessions", label: "Sessions" },
  { value: "none", label: "None" },
];

const aggregationOptions: Array<{ value: MetricMappingAggregation; label: string }> = [
  { value: "sum", label: "Sum" },
  { value: "count", label: "Count" },
  { value: "average", label: "Average" },
  { value: "ratio", label: "Ratio" },
  { value: "rule", label: "Rule" },
  { value: "none", label: "None" },
];

const filterOptions: Array<{ value: MetricMappingFilterPreset; label: string }> = [
  { value: "selected_reporting_window", label: "Selected Reporting Window" },
  { value: "completed_orders", label: "Completed Orders" },
  { value: "paid_orders", label: "Paid Orders" },
  { value: "all_orders", label: "All Orders" },
  { value: "active_campaigns", label: "Active Campaigns" },
  { value: "none", label: "None" },
];

const formulaOptions: Array<{ value: MetricFormulaTemplate; label: string }> = [
  { value: "none", label: "No formula" },
  { value: "revenue_divide_spend", label: "Revenue ÷ Spend" },
  { value: "revenue_divide_orders", label: "Revenue ÷ Orders" },
  { value: "spend_divide_orders", label: "Spend ÷ Orders" },
  { value: "spend_divide_purchases", label: "Spend ÷ Purchases" },
  { value: "platform_value_divide_spend", label: "Platform Value ÷ Spend" },
  { value: "clicks_divide_impressions", label: "Clicks ÷ Impressions" },
  { value: "spend_divide_clicks", label: "Spend ÷ Clicks" },
  { value: "spend_divide_impressions_times_1000", label: "Spend ÷ Impressions × 1000" },
  { value: "purchases_divide_clicks", label: "Purchases ÷ Clicks" },
  { value: "checkout_divide_add_to_cart", label: "Checkout ÷ Add To Cart" },
  { value: "store_vs_platform_gap", label: "Store vs Platform Gap" },
];

const inputClass = "w-full rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-sm text-[var(--ink)] outline-none";
const primaryButton = "rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton = "rounded-2xl border border-[var(--line)] bg-white/72 px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60";

export default function MetricMappingPage() {
  const [entries, setEntries] = useState<MappingEntry[]>([]);
  const [summary, setSummary] = useState<MappingResponse["summary"] | null>(null);
  const [storage, setStorage] = useState<MappingResponse["storage"] | null>(null);
  const [selectedMetricId, setSelectedMetricId] = useState("");
  const [query, setQuery] = useState("");
  const [showEditableOnly, setShowEditableOnly] = useState(false);
  const [draft, setDraft] = useState<MappingDraft | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadMappings(preferredMetricId?: string) {
    const response = await fetch("/api/admin/metric-mappings", { cache: "no-store" });
    const payload = (await response.json()) as MappingResponse;

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not load metric mappings.");
    }

    setEntries(payload.entries);
    setSummary(payload.summary);
    setStorage(payload.storage);
    const nextMetricId = preferredMetricId && payload.entries.some((entry) => entry.metric.id === preferredMetricId)
      ? preferredMetricId
      : payload.entries[0]?.metric.id ?? "";
    setSelectedMetricId(nextMetricId);
  }

  useEffect(() => {
    void loadMappings().catch((err) => setError(err instanceof Error ? err.message : "Could not load metric mappings."));
  }, []);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (showEditableOnly && !entry.canEditMapping) return false;
      if (!normalized) return true;
      return [
        entry.metric.id,
        entry.metric.label,
        entry.metric.category,
        entry.metric.source,
        entry.metric.truthLayer,
        entry.mapping.sourceType,
        entry.mapping.sourceField,
        entry.mapping.formulaTemplate,
      ].join(" ").toLowerCase().includes(normalized);
    });
  }, [entries, query, showEditableOnly]);

  const selectedEntry =
    entries.find((entry) => entry.metric.id === selectedMetricId) ?? filteredEntries[0] ?? entries[0] ?? null;

  useEffect(() => {
    if (!selectedEntry) return;
    setDraft(buildDraft(selectedEntry.mapping));
  }, [selectedEntry?.metric.id, selectedEntry?.mapping.updatedAt]);

  async function saveMapping() {
    if (!selectedEntry || !draft) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/metric-mappings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metricId: selectedEntry.metric.id,
          scope: "global",
          sourceType: draft.sourceType,
          sourceField: draft.sourceField,
          aggregation: draft.aggregation,
          filterPreset: draft.filterPreset,
          formulaTemplate: draft.formulaTemplate,
          enabled: draft.enabled,
          adminNotes: draft.adminNotes,
        }),
      });
      const payload = (await response.json()) as MappingResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save metric mapping.");
      }

      setEntries(payload.entries);
      setSummary(payload.summary);
      setMessage(`${selectedEntry.metric.label} mapping saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save metric mapping.");
    } finally {
      setBusy(false);
    }
  }

  async function resetMapping() {
    if (!selectedEntry) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/metric-mappings?metricId=${encodeURIComponent(selectedEntry.metric.id)}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as MappingResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not reset metric mapping.");
      }

      setEntries(payload.entries);
      setSummary(payload.summary);
      setMessage(`${selectedEntry.metric.label} mapping reset to code default.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset metric mapping.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageLead
          eyebrow="Metric Mapping Admin"
          title="Control metric sources without free-form formulas"
          summary="Map every dashboard metric to a controlled source, field, aggregation, filter, or approved formula template. Protected metrics stay visible, but unsafe execution logic remains in code."
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <SourcePill label={`${summary?.total ?? entries.length} metrics`} tone="good" />
            <SourcePill label={`${summary?.controlledMappings ?? 0} editable`} tone="warn" />
            <SourcePill label={`${summary?.developerManaged ?? 0} protected`} tone="default" />
            <SourcePill label={storage?.durable ? "Durable storage" : "Temporary storage"} tone={storage?.durable ? "good" : "warn"} />
          </div>
          <Link href="/admin/metrics" className={secondaryButton}>Back to Metric Registry</Link>
        </div>

        {message ? <Notice tone="good" message={message} /> : null}
        {error ? <Notice tone="warn" message={error} /> : null}

        <Section title="All Metric Mappings" subtitle="Every metric appears here. Only controlled-mapping metrics can be edited in v1.">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),420px]">
            <div className="rounded-[24px] border border-[var(--line)] bg-white/45 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search revenue, MER, ROAS, CTR, WooCommerce, Meta..." className={inputClass} />
                <label className="flex shrink-0 items-center gap-3 rounded-2xl border border-[var(--line)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--ink)]">
                  <input type="checkbox" checked={showEditableOnly} onChange={(event) => setShowEditableOnly(event.target.checked)} />
                  Editable only
                </label>
              </div>

              <div className="mt-4 max-h-[720px] overflow-auto rounded-[20px] border border-[var(--line)] bg-white/62">
                <table className="min-w-[980px] w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[var(--bg-soft)] text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3">Metric</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Field</th>
                      <th className="px-4 py-3">Formula</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => {
                      const active = entry.metric.id === selectedEntry?.metric.id;
                      return (
                        <tr key={entry.metric.id} className={`border-t border-[var(--line)] ${active ? "bg-[rgba(161,66,26,0.08)]" : ""}`}>
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => setSelectedMetricId(entry.metric.id)} className="text-left">
                              <div className="font-semibold text-[var(--ink)]">{entry.metric.label}</div>
                              <div className="mt-1 text-xs text-[var(--muted)]">{entry.metric.id}</div>
                            </button>
                          </td>
                          <td className="px-4 py-3"><SourcePill label={entry.canEditMapping ? "Editable" : "Protected"} tone={entry.canEditMapping ? "warn" : "default"} /></td>
                          <td className="px-4 py-3">{formatOption(entry.mapping.sourceType)}</td>
                          <td className="px-4 py-3">{formatOption(entry.mapping.sourceField)}</td>
                          <td className="px-4 py-3">{formatOption(entry.mapping.formulaTemplate)}</td>
                          <td className="px-4 py-3"><SourcePill label={entry.hasSavedMapping ? "Saved mapping" : "Code default"} tone={entry.hasSavedMapping ? "good" : "default"} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--line)] bg-white/58 p-4">
              {selectedEntry && draft ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Selected Metric</div>
                    <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">{selectedEntry.metric.label}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{selectedEntry.metric.meaning}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <SourcePill label={selectedEntry.metric.category} tone="default" />
                      <SourcePill label={selectedEntry.metric.editability} tone={selectedEntry.canEditMapping ? "warn" : "default"} />
                      <SourcePill label={selectedEntry.metric.bindingStatus} tone={selectedEntry.metric.bindingStatus === "live" ? "good" : "warn"} />
                    </div>
                  </div>

                  <Field label="Source Type">
                    <select value={draft.sourceType} disabled={!selectedEntry.canEditMapping} onChange={(event) => setDraft({ ...draft, sourceType: event.target.value as MetricMappingSourceType })} className={inputClass}>
                      {sourceTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>

                  <Field label="Source Field">
                    <select value={draft.sourceField} disabled={!selectedEntry.canEditMapping} onChange={(event) => setDraft({ ...draft, sourceField: event.target.value as MetricMappingSourceField })} className={inputClass}>
                      {sourceFieldOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>

                  <Field label="Aggregation">
                    <select value={draft.aggregation} disabled={!selectedEntry.canEditMapping} onChange={(event) => setDraft({ ...draft, aggregation: event.target.value as MetricMappingAggregation })} className={inputClass}>
                      {aggregationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>

                  <Field label="Filter Preset">
                    <select value={draft.filterPreset} disabled={!selectedEntry.canEditMapping} onChange={(event) => setDraft({ ...draft, filterPreset: event.target.value as MetricMappingFilterPreset })} className={inputClass}>
                      {filterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>

                  <Field label="Formula Template">
                    <select value={draft.formulaTemplate} disabled={!selectedEntry.canEditMapping} onChange={(event) => setDraft({ ...draft, formulaTemplate: event.target.value as MetricFormulaTemplate })} className={inputClass}>
                      {formulaOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>

                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--ink)]">
                    <input type="checkbox" checked={draft.enabled} disabled={!selectedEntry.canEditMapping} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />
                    Mapping enabled
                  </label>

                  <Field label="Admin Notes">
                    <textarea value={draft.adminNotes} disabled={!selectedEntry.canEditMapping} onChange={(event) => setDraft({ ...draft, adminNotes: event.target.value })} rows={4} className={inputClass} placeholder="Why does this metric use this source/field?" />
                  </Field>

                  <div className="rounded-2xl border border-[var(--line)] bg-white/62 p-3 text-sm leading-6 text-[var(--muted)]">
                    <strong className="text-[var(--ink)]">Protected logic:</strong> {selectedEntry.metric.protectedReason}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button type="button" disabled={!selectedEntry.canEditMapping || busy} onClick={() => void saveMapping()} className={primaryButton}>Save Mapping</button>
                    <button type="button" disabled={!selectedEntry.canEditMapping || busy} onClick={() => void resetMapping()} className={secondaryButton}>Reset</button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[var(--muted)]">Select a metric to edit or inspect it.</div>
              )}
            </div>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

function buildDraft(mapping: MetricMappingOverride): MappingDraft {
  return {
    sourceType: mapping.sourceType,
    sourceField: mapping.sourceField,
    aggregation: mapping.aggregation,
    filterPreset: mapping.filterPreset,
    formulaTemplate: mapping.formulaTemplate,
    enabled: mapping.enabled,
    adminNotes: mapping.adminNotes ?? "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</div>
      {children}
    </div>
  );
}

function Notice({ tone, message }: { tone: "good" | "warn"; message: string }) {
  return (
    <div className={`rounded-[22px] border px-4 py-3 text-sm ${tone === "good" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
      {message}
    </div>
  );
}

function formatOption(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
