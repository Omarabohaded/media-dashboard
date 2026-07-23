import {
  getRuntimeStorageMeta,
  readRuntimeJsonStore,
  writeRuntimeJsonStore,
} from "@/lib/runtimeStorage";

export type MetricMappingSourceType =
  | "woocommerce"
  | "shopify"
  | "meta"
  | "google"
  | "tiktok"
  | "snap"
  | "calculated"
  | "manual"
  | "not_connected";

export type MetricMappingSourceField =
  | "grossSales"
  | "netSales"
  | "ordersCount"
  | "averageOrderValue"
  | "taxTotal"
  | "shippingTotal"
  | "totalAdSpend"
  | "platformPurchaseValue"
  | "purchases"
  | "clicks"
  | "impressions"
  | "ctr"
  | "cpc"
  | "cpm"
  | "frequency"
  | "reach"
  | "addToCart"
  | "checkoutInitiated"
  | "newCustomers"
  | "sessions"
  | "none";

export type MetricMappingAggregation =
  | "sum"
  | "count"
  | "average"
  | "ratio"
  | "rule"
  | "none";

export type MetricMappingFilterPreset =
  | "completed_orders"
  | "paid_orders"
  | "all_orders"
  | "active_campaigns"
  | "selected_reporting_window"
  | "none";

export type MetricFormulaTemplate =
  | "none"
  | "revenue_divide_spend"
  | "revenue_divide_orders"
  | "spend_divide_orders"
  | "spend_divide_purchases"
  | "platform_value_divide_spend"
  | "clicks_divide_impressions"
  | "spend_divide_clicks"
  | "spend_divide_impressions_times_1000"
  | "purchases_divide_clicks"
  | "checkout_divide_add_to_cart"
  | "store_vs_platform_gap";

export type MetricMappingScope = "global" | "client";

export type MetricMappingOverride = {
  metricId: string;
  scope: MetricMappingScope;
  clientId: string | null;
  sourceType: MetricMappingSourceType;
  sourceField: MetricMappingSourceField;
  aggregation: MetricMappingAggregation;
  filterPreset: MetricMappingFilterPreset;
  formulaTemplate: MetricFormulaTemplate;
  enabled: boolean;
  adminNotes: string | null;
  updatedAt: string | null;
};

type MetricMappingState = {
  version: 1;
  updatedAt: string | null;
  mappings: MetricMappingOverride[];
};

const METRIC_MAPPING_STORE_KEY = "media-dashboard:metric-mappings";
const METRIC_MAPPING_STORE_FILE = "metric-mappings.json";

function defaultState(): MetricMappingState {
  return {
    version: 1,
    updatedAt: null,
    mappings: [],
  };
}

export function buildDefaultMetricMapping(metricId: string): MetricMappingOverride {
  return {
    metricId,
    scope: "global",
    clientId: null,
    sourceType: "not_connected",
    sourceField: "none",
    aggregation: "none",
    filterPreset: "selected_reporting_window",
    formulaTemplate: "none",
    enabled: true,
    adminNotes: null,
    updatedAt: null,
  };
}

function normalizeMapping(mapping: MetricMappingOverride): MetricMappingOverride {
  return {
    metricId: mapping.metricId,
    scope: mapping.scope === "client" ? "client" : "global",
    clientId: mapping.scope === "client" ? mapping.clientId ?? null : null,
    sourceType: mapping.sourceType ?? "not_connected",
    sourceField: mapping.sourceField ?? "none",
    aggregation: mapping.aggregation ?? "none",
    filterPreset: mapping.filterPreset ?? "selected_reporting_window",
    formulaTemplate: mapping.formulaTemplate ?? "none",
    enabled: mapping.enabled !== false,
    adminNotes: mapping.adminNotes?.trim() || null,
    updatedAt: mapping.updatedAt ?? null,
  };
}

function mappingKey(mapping: Pick<MetricMappingOverride, "metricId" | "scope" | "clientId">) {
  return `${mapping.metricId}:${mapping.scope}:${mapping.scope === "client" ? mapping.clientId ?? "" : "global"}`;
}

function hasMeaningfulMapping(mapping: MetricMappingOverride) {
  const defaults = buildDefaultMetricMapping(mapping.metricId);
  return Boolean(
    mapping.sourceType !== defaults.sourceType ||
      mapping.sourceField !== defaults.sourceField ||
      mapping.aggregation !== defaults.aggregation ||
      mapping.filterPreset !== defaults.filterPreset ||
      mapping.formulaTemplate !== defaults.formulaTemplate ||
      mapping.enabled !== defaults.enabled ||
      mapping.adminNotes
  );
}

export async function readMetricMappingStore(): Promise<MetricMappingState> {
  const parsed = await readRuntimeJsonStore<MetricMappingState>(
    METRIC_MAPPING_STORE_KEY,
    METRIC_MAPPING_STORE_FILE,
    defaultState()
  );

  return {
    ...defaultState(),
    ...parsed,
    mappings: (parsed.mappings ?? []).map((mapping) => normalizeMapping(mapping)),
  };
}

async function updateMetricMappingStore(
  updater: (state: MetricMappingState) => MetricMappingState
) {
  const current = await readMetricMappingStore();
  const next = updater(current);
  next.updatedAt = new Date().toISOString();
  await writeRuntimeJsonStore(
    METRIC_MAPPING_STORE_KEY,
    METRIC_MAPPING_STORE_FILE,
    next
  );
  return next;
}

export function getMetricMappingStoreMeta() {
  return getRuntimeStorageMeta(METRIC_MAPPING_STORE_FILE);
}

export async function listMetricMappings() {
  const state = await readMetricMappingStore();
  return state.mappings;
}

export async function getMetricMapping(metricId: string, clientId?: string | null) {
  const state = await readMetricMappingStore();
  const clientMapping = clientId
    ? state.mappings.find(
        (mapping) => mapping.metricId === metricId && mapping.scope === "client" && mapping.clientId === clientId
      )
    : null;

  return (
    clientMapping ??
    state.mappings.find((mapping) => mapping.metricId === metricId && mapping.scope === "global") ??
    null
  );
}

export async function upsertMetricMapping(mapping: Omit<MetricMappingOverride, "updatedAt">) {
  const normalized = normalizeMapping({
    ...mapping,
    updatedAt: new Date().toISOString(),
  });

  const nextState = await updateMetricMappingStore((state) => {
    const key = mappingKey(normalized);
    const filtered = state.mappings.filter((item) => mappingKey(item) !== key);

    return {
      ...state,
      mappings: hasMeaningfulMapping(normalized) ? [normalized, ...filtered] : filtered,
    };
  });

  return nextState.mappings.find((item) => mappingKey(item) === mappingKey(normalized)) ?? null;
}

export async function clearMetricMapping(metricId: string, scope: MetricMappingScope = "global", clientId?: string | null) {
  const key = mappingKey({ metricId, scope, clientId: scope === "client" ? clientId ?? null : null });
  await updateMetricMappingStore((state) => ({
    ...state,
    mappings: state.mappings.filter((mapping) => mappingKey(mapping) !== key),
  }));
}

export async function clearClientMetricMappings(clientId: string) {
  await updateMetricMappingStore((state) => ({
    ...state,
    mappings: state.mappings.filter(
      (mapping) =>
        mapping.scope !== "client" || mapping.clientId !== clientId
    ),
  }));
}
