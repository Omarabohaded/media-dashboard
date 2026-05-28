import {
  metricDictionary,
  type CustomSignalDefinition,
  type MetricDefinition,
  type SourceMappingDefinition,
} from "@/lib/metricDictionary";

export type MetricRegistryEditability =
  | "view_only"
  | "controlled_mapping"
  | "developer_managed";

export type MetricBindingStatus = "live" | "partial" | "documented";

export type MetricAggregationMode =
  | "sum"
  | "count"
  | "average"
  | "ratio"
  | "share"
  | "rule"
  | "unknown";

export type MetricRegistryEntry = {
  id: string;
  label: string;
  category: string;
  priority: string;
  source: string;
  level: string;
  formula: string;
  meaning: string;
  whereItAppears: string;
  primaryTruth: boolean;
  truthLayer: string;
  aggregation: MetricAggregationMode;
  bindingStatus: MetricBindingStatus;
  currentFieldBinding: string;
  liveBindingNote: string;
  rawFields: string[];
  derivedFrom: string[];
  dashboardUsage: string[];
  implementationLocations: string[];
  editability: MetricRegistryEditability;
  editableFields: string[];
  protectedFields: string[];
  protectedReason: string;
  benchmarkBasis: string;
  pairing: string;
  integrationNote: string | null;
  signalRule: string | null;
  adminRecommendation: string;
};

const DEVELOPER_MANAGED_METRICS = new Set([
  "creative_fatigue_signal",
  "scaling_efficiency_signal",
  "under_scaling_signal",
  "tracking_gap_signal",
  "benchmark_variance",
  "volatility_score",
  "anomaly_flag",
  "channel_efficiency_index",
]);

const DENOMINATOR_SENSITIVE_METRICS = new Set([
  "cpa_cac",
  "new_customer_cac",
  "revenue_per_click",
  "purchase_conversion_rate",
  "checkout_to_purchase_rate",
  "cart_to_checkout_rate",
  "checkout_initiation_rate",
  "add_to_cart_rate",
  "view_content_rate",
  "lpv_rate",
]);

const LIVE_IMPLEMENTATION_OVERRIDES: Record<
  string,
  Partial<MetricRegistryEntry>
> = {
  total_ad_spend: {
    bindingStatus: "live",
    aggregation: "sum",
    truthLayer: "Blended paid-media spend",
    currentFieldBinding:
      "Summed from live media spend previews, currently through metaPreview.totals.spend.",
    liveBindingNote:
      "The current dashboard is Meta-first in live previews, while the workbook definition expects cross-channel spend once Google, TikTok, and Snap are added to the same snapshot layer.",
    rawFields: ["MediaPlatformSnapshot.spend", "metaPreview.totals.spend"],
    derivedFrom: [],
    dashboardUsage: ["Command Center", "Business Health"],
    implementationLocations: [
      "src/lib/syncContracts.ts",
      "src/app/page.tsx",
      "src/app/health/page.tsx",
    ],
  },
  store_revenue: {
    bindingStatus: "live",
    aggregation: "sum",
    truthLayer: "Store / website truth",
    currentFieldBinding:
      "Read from storePreview.grossSales, backed by BusinessTruthSnapshot.grossSales.",
    liveBindingNote:
      "The current live dashboard uses gross sales as the main business truth. Net revenue exists in the dictionary as a stronger future truth layer, but it is not the live default yet.",
    rawFields: ["BusinessTruthSnapshot.grossSales", "storePreview.grossSales"],
    derivedFrom: [],
    dashboardUsage: ["Command Center", "Business Health"],
    implementationLocations: [
      "src/lib/syncContracts.ts",
      "src/app/page.tsx",
      "src/app/health/page.tsx",
    ],
  },
  orders: {
    bindingStatus: "live",
    aggregation: "count",
    truthLayer: "Store / website truth",
    currentFieldBinding:
      "Read from storePreview.ordersCount, backed by BusinessTruthSnapshot.orders.",
    liveBindingNote:
      "The dashboard is already treating completed store orders as the main count truth for executive summary surfaces.",
    rawFields: ["BusinessTruthSnapshot.orders", "storePreview.ordersCount"],
    derivedFrom: [],
    dashboardUsage: ["Command Center", "Business Health"],
    implementationLocations: [
      "src/lib/syncContracts.ts",
      "src/app/page.tsx",
      "src/app/health/page.tsx",
    ],
  },
  mer: {
    bindingStatus: "live",
    aggregation: "ratio",
    truthLayer: "Cross-truth business efficiency",
    currentFieldBinding:
      "Calculated inline as storePreview.grossSales / metaPreview.totals.spend.",
    liveBindingNote:
      "This is one of the clearest examples of a metric that should stay code-defined, while allowing controlled overrides for the revenue basis later if you choose to support gross-versus-net admin control.",
    rawFields: ["storePreview.grossSales", "metaPreview.totals.spend"],
    derivedFrom: ["store_revenue", "total_ad_spend"],
    dashboardUsage: ["Command Center", "Business Health"],
    implementationLocations: [
      "src/app/page.tsx",
      "src/app/health/page.tsx",
      "src/lib/workbookSignals.ts",
    ],
  },
  blended_roas: {
    bindingStatus: "live",
    aggregation: "ratio",
    truthLayer: "Blended platform attribution",
    currentFieldBinding:
      "Calculated inline as metaPreview.totals.purchaseValue / metaPreview.totals.spend.",
    liveBindingNote:
      "The code already keeps this separate from MER, which is the right architecture for this dashboard because platform-attributed revenue is diagnostic rather than final business truth.",
    rawFields: ["metaPreview.totals.purchaseValue", "metaPreview.totals.spend"],
    derivedFrom: ["platform_purchase_value", "total_ad_spend"],
    dashboardUsage: ["Command Center", "Business Health"],
    implementationLocations: [
      "src/app/page.tsx",
      "src/app/health/page.tsx",
    ],
  },
  aov: {
    bindingStatus: "live",
    aggregation: "ratio",
    truthLayer: "Store / website truth",
    currentFieldBinding:
      "Calculated inline as storePreview.grossSales / storePreview.ordersCount.",
    liveBindingNote:
      "AOV is derived cleanly from store truth already, so the safest admin control later is choosing the revenue basis rather than exposing a free-form formula editor.",
    rawFields: ["storePreview.grossSales", "storePreview.ordersCount"],
    derivedFrom: ["store_revenue", "orders"],
    dashboardUsage: ["Command Center", "Business Health"],
    implementationLocations: [
      "src/app/page.tsx",
      "src/app/health/page.tsx",
    ],
  },
  purchases: {
    bindingStatus: "partial",
    aggregation: "count",
    truthLayer: "Website truth with platform proxy fallback",
    currentFieldBinding:
      "The workbook wants website/store purchases, but live previews still lean on metaPreview.totals.purchases as a proxy in some surfaces.",
    liveBindingNote:
      "This is a key metric to inspect before allowing edits. The meaning is business-critical, but the live implementation is still split between workbook truth and platform proxy availability.",
    rawFields: ["metaPreview.totals.purchases"],
    derivedFrom: [],
    dashboardUsage: ["Command Center", "Business Health", "Funnel readiness"],
    implementationLocations: [
      "src/app/page.tsx",
      "src/app/health/page.tsx",
      "src/lib/funnelReadiness.ts",
    ],
  },
  purchase_conversion_rate: {
    bindingStatus: "partial",
    aggregation: "ratio",
    truthLayer: "Website analytics truth",
    currentFieldBinding:
      "Documented in the workbook and surfaced through funnel readiness, but still blocked until analytics truth is connected.",
    liveBindingNote:
      "This should remain a derived code metric with a controlled denominator choice only if the project later supports multiple analytics truth layers.",
    rawFields: ["purchases", "sessions"],
    derivedFrom: ["purchases", "sessions"],
    dashboardUsage: ["Business Health", "Funnel readiness"],
    implementationLocations: [
      "src/app/health/page.tsx",
      "src/lib/funnelReadiness.ts",
      "src/lib/metricDictionary.ts",
    ],
  },
  checkout_to_purchase_rate: {
    bindingStatus: "partial",
    aggregation: "ratio",
    truthLayer: "Website analytics truth",
    currentFieldBinding:
      "Documented in the workbook and surfaced through funnel readiness, but still blocked until checkout truth is available.",
    liveBindingNote:
      "This is a good candidate for a view-first registry entry now and a controlled editable denominator later only if checkout events become durable across storefront types.",
    rawFields: ["purchases", "begin_checkout"],
    derivedFrom: ["purchases", "begin_checkout"],
    dashboardUsage: ["Business Health", "Funnel readiness"],
    implementationLocations: [
      "src/app/health/page.tsx",
      "src/lib/funnelReadiness.ts",
      "src/lib/metricDictionary.ts",
    ],
  },
  revenue_per_click: {
    bindingStatus: "live",
    aggregation: "ratio",
    truthLayer: "Cross-truth monetization",
    currentFieldBinding:
      "Calculated in Business Health as store revenue divided by Meta clicks when both are available.",
    liveBindingNote:
      "This metric is already useful, but it should stay controlled because the revenue source can be either store truth or attributed revenue depending on the business definition.",
    rawFields: ["storePreview.grossSales", "metaPreview.totals.clicks"],
    derivedFrom: ["store_revenue", "clicks"],
    dashboardUsage: ["Business Health"],
    implementationLocations: ["src/app/health/page.tsx"],
  },
  cpa_cac: {
    bindingStatus: "documented",
    aggregation: "ratio",
    truthLayer: "Platform-specific or blended efficiency",
    currentFieldBinding:
      "The workbook definition exists, but the live dashboard does not yet centralize one active denominator choice for CPA versus CAC.",
    liveBindingNote:
      "This is the clearest controlled-edit example for phase two: admins should be able to choose purchases versus new customers, but they should not edit the core spend math itself.",
    rawFields: ["spend", "purchases", "new_customers"],
    derivedFrom: ["total_ad_spend", "purchases", "new_customer_count"],
    dashboardUsage: ["Paid Media efficiency (planned)"],
    implementationLocations: [
      "src/lib/metricDictionary.ts",
      "src/app/dashboardData.ts",
    ],
  },
  roas_by_channel: {
    bindingStatus: "documented",
    aggregation: "ratio",
    truthLayer: "Platform attribution",
    currentFieldBinding:
      "The workbook definition exists, but the live dashboard does not yet expose a centralized per-channel registry binding for attributed revenue and spend.",
    liveBindingNote:
      "This should stay code-defined, with safe admin controls limited to benchmark ranges and channel inclusion once multi-source media snapshots are mature.",
    rawFields: ["attributed_revenue", "channel_spend"],
    derivedFrom: ["channel_revenue", "channel_spend"],
    dashboardUsage: ["Paid Media efficiency (planned)"],
    implementationLocations: [
      "src/lib/metricDictionary.ts",
      "src/app/dashboardData.ts",
    ],
  },
  tracking_gap_signal: {
    bindingStatus: "live",
    aggregation: "rule",
    truthLayer: "Cross-truth diagnostic rule",
    currentFieldBinding:
      "Evaluated through evaluateTrackingGap using store revenue, platform revenue, store orders, and platform purchases.",
    liveBindingNote:
      "This is a rule-engine metric. Admins should inspect it, but threshold math and mismatch logic should remain code-controlled until a real rules engine exists.",
    rawFields: [
      "storeRevenue",
      "platformRevenue",
      "storeOrders",
      "platformPurchases",
    ],
    derivedFrom: ["store_revenue", "orders", "blended_roas", "purchases"],
    dashboardUsage: ["Command Center", "Business Health"],
    implementationLocations: [
      "src/lib/workbookSignals.ts",
      "src/app/page.tsx",
      "src/app/health/page.tsx",
    ],
  },
};

export function getMetricRegistry() {
  return [...metricDictionary.metrics]
    .map((metric) => buildMetricRegistryEntry(metric))
    .sort((left, right) => {
      if (left.category === right.category) {
        return left.label.localeCompare(right.label);
      }

      return left.category.localeCompare(right.category);
    });
}

export function getMetricRegistryEntry(metricId: string) {
  return getMetricRegistry().find((metric) => metric.id === metricId) ?? null;
}

export function getMetricRegistrySummary(entries = getMetricRegistry()) {
  return {
    total: entries.length,
    liveBindings: entries.filter((entry) => entry.bindingStatus === "live").length,
    partialBindings: entries.filter((entry) => entry.bindingStatus === "partial")
      .length,
    documentedOnly: entries.filter((entry) => entry.bindingStatus === "documented")
      .length,
    controlledMappings: entries.filter(
      (entry) => entry.editability === "controlled_mapping"
    ).length,
    developerManaged: entries.filter(
      (entry) => entry.editability === "developer_managed"
    ).length,
    viewOnly: entries.filter((entry) => entry.editability === "view_only").length,
  };
}

function buildMetricRegistryEntry(metric: MetricDefinition): MetricRegistryEntry {
  const sourceMapping = findSourceMapping(metric);
  const customSignal = findCustomSignal(metric);
  const override = LIVE_IMPLEMENTATION_OVERRIDES[metric.id] ?? {};
  const editability =
    override.editability ?? getMetricEditability(metric, sourceMapping, customSignal);

  return {
    id: metric.id,
    label: metric.label,
    category: metric.category,
    priority: metric.priority,
    source: metric.source,
    level: metric.level,
    formula: metric.formula,
    meaning: metric.meaning,
    whereItAppears: metric.whereItAppears,
    primaryTruth: metric.primaryTruth,
    truthLayer:
      override.truthLayer ?? getTruthLayer(metric, sourceMapping, customSignal),
    aggregation:
      override.aggregation ?? getAggregationMode(metric, sourceMapping, customSignal),
    bindingStatus: override.bindingStatus ?? (sourceMapping ? "documented" : "partial"),
    currentFieldBinding:
      override.currentFieldBinding ??
      sourceMapping?.rawFieldsNeeded ??
      "No live field binding has been centralized yet.",
    liveBindingNote:
      override.liveBindingNote ??
      sourceMapping?.logicNote ??
      customSignal?.implementationLogic ??
      "This metric is documented, but the live dashboard still needs a central executable registry for it.",
    rawFields:
      override.rawFields ?? parseRawFields(sourceMapping?.rawFieldsNeeded ?? null),
    derivedFrom:
      override.derivedFrom ?? inferDerivedInputs(metric, sourceMapping, customSignal),
    dashboardUsage:
      override.dashboardUsage ?? [metric.whereItAppears, metric.category],
    implementationLocations:
      override.implementationLocations ??
      getDefaultImplementationLocations(sourceMapping, customSignal),
    editability,
    editableFields: getEditableFields(metric, editability),
    protectedFields: getProtectedFields(editability),
    protectedReason: getProtectedReason(metric, editability),
    benchmarkBasis: metric.benchmarkBasis,
    pairing: metric.bestPairedWith,
    integrationNote: sourceMapping?.integrationNote ?? null,
    signalRule: customSignal?.equationOrRule ?? null,
    adminRecommendation: getAdminRecommendation(metric, editability, sourceMapping),
  };
}

function findSourceMapping(metric: MetricDefinition) {
  return (
    metricDictionary.sourceMapping.find(
      (entry) => entry.metricName === metric.label
    ) ?? null
  );
}

function findCustomSignal(metric: MetricDefinition) {
  return (
    metricDictionary.customSignals.find((entry) => entry.signal === metric.label) ??
    null
  );
}

function getMetricEditability(
  metric: MetricDefinition,
  sourceMapping: SourceMappingDefinition | null,
  customSignal: CustomSignalDefinition | null
): MetricRegistryEditability {
  if (
    DEVELOPER_MANAGED_METRICS.has(metric.id) ||
    /rule-based|rule engine/i.test(customSignal?.equationOrRule ?? "") ||
    /signal|anomaly|volatility/i.test(metric.label)
  ) {
    return "developer_managed";
  }

  if (
    sourceMapping ||
    customSignal ||
    metric.primaryTruth ||
    metric.formula.includes("/") ||
    metric.formula.includes("based on chosen definition")
  ) {
    return "controlled_mapping";
  }

  return "view_only";
}

function getTruthLayer(
  metric: MetricDefinition,
  sourceMapping: SourceMappingDefinition | null,
  customSignal: CustomSignalDefinition | null
) {
  if (
    DEVELOPER_MANAGED_METRICS.has(metric.id) ||
    /rule-based/i.test(customSignal?.equationOrRule ?? "")
  ) {
    return "Rule / cross-metric logic";
  }

  if (
    metric.primaryTruth ||
    metric.scopeType.toLowerCase().includes("website") ||
    metric.scopeType.toLowerCase().includes("store") ||
    metric.source.includes("Website")
  ) {
    return "Store / website truth";
  }

  if (
    metric.scopeType.toLowerCase().includes("blended") ||
    metric.scopeType.toLowerCase().includes("cross-platform") ||
    metric.id === "total_ad_spend" ||
    metric.id === "blended_roas"
  ) {
    return "Blended cross-platform";
  }

  if (/Meta|Google|TikTok|Snap/.test(metric.source)) {
    return "Platform truth";
  }

  if (sourceMapping?.primarySource.includes("Website")) {
    return "Store / website truth";
  }

  return "Derived business logic";
}

function getAggregationMode(
  metric: MetricDefinition,
  sourceMapping: SourceMappingDefinition | null,
  customSignal: CustomSignalDefinition | null
): MetricAggregationMode {
  if (
    /rule-based|signal/i.test(customSignal?.equationOrRule ?? "") ||
    /signal|anomaly|volatility/i.test(metric.label)
  ) {
    return "rule";
  }

  if (metric.label.includes("Share")) {
    return "share";
  }

  if (
    metric.label.includes("Rate") ||
    metric.label.includes("ROAS") ||
    metric.label === "MER" ||
    metric.formula.includes("/")
  ) {
    return "ratio";
  }

  if (/count of|unique|orders|purchases/i.test(metric.formula)) {
    return "count";
  }

  if (/average/i.test(metric.label) || metric.label === "AOV") {
    return "average";
  }

  if (/sum of|total/i.test(metric.formula)) {
    return "sum";
  }

  if (/revenue -|margin/i.test(metric.formula)) {
    return "sum";
  }

  if (sourceMapping?.logicNote.includes("/") || sourceMapping?.logicNote.includes("sum")) {
    return sourceMapping.logicNote.includes("/") ? "ratio" : "sum";
  }

  return "unknown";
}

function parseRawFields(rawFields: string | null) {
  if (!rawFields) {
    return [];
  }

  return rawFields
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);
}

function inferDerivedInputs(
  metric: MetricDefinition,
  sourceMapping: SourceMappingDefinition | null,
  customSignal: CustomSignalDefinition | null
) {
  const rawFields = parseRawFields(sourceMapping?.rawFieldsNeeded ?? null);

  if (rawFields.length) {
    return rawFields;
  }

  if (customSignal?.inputsNeeded) {
    return customSignal.inputsNeeded
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean);
  }

  return [];
}

function getDefaultImplementationLocations(
  sourceMapping: SourceMappingDefinition | null,
  customSignal: CustomSignalDefinition | null
) {
  const locations = ["src/lib/metricDictionary.ts"];

  if (sourceMapping) {
    locations.push("src/lib/metricDictionary.ts (source mapping)");
  }

  if (customSignal) {
    locations.push("src/lib/metricDictionary.ts (custom signals)");
  }

  return locations;
}

function getEditableFields(
  metric: MetricDefinition,
  editability: MetricRegistryEditability
) {
  if (editability !== "controlled_mapping") {
    return [];
  }

  const fields = ["Benchmark thresholds", "Admin notes"];

  if (metric.primaryTruth || metric.source.includes("Website")) {
    fields.push("Truth-layer default");
  }

  if (metric.formula.includes("/") || metric.label.includes("Rate")) {
    fields.push("Aggregation or ratio basis");
  }

  if (
    DENOMINATOR_SENSITIVE_METRICS.has(metric.id) ||
    metric.formula.includes("based on chosen definition")
  ) {
    fields.push("Denominator choice");
  }

  if (
    metric.id === "store_revenue" ||
    metric.id === "net_revenue" ||
    metric.id === "gross_revenue" ||
    metric.id === "aov"
  ) {
    fields.push("Revenue basis selection");
  }

  if (metric.id === "total_ad_spend" || metric.id === "roas_by_channel") {
    fields.push("Included channel set");
  }

  return fields;
}

function getProtectedFields(editability: MetricRegistryEditability) {
  if (editability === "developer_managed") {
    return [
      "Raw API normalization",
      "Rule-engine logic",
      "Alert threshold math inside engines",
    ];
  }

  if (editability === "controlled_mapping") {
    return [
      "Raw API normalization",
      "Fallback logic for missing truth layers",
      "Derived calculation code",
    ];
  }

  return [
    "Metric definition",
    "Underlying formula",
    "Raw source normalization",
  ];
}

function getProtectedReason(
  metric: MetricDefinition,
  editability: MetricRegistryEditability
) {
  if (editability === "developer_managed") {
    return "This metric depends on branching logic or cross-metric rules. It should stay code-controlled until a validated rules engine exists.";
  }

  if (editability === "controlled_mapping") {
    return `The safest editable surface for ${metric.label} is the mapping and threshold layer, not the raw executable formula.`;
  }

  return `${metric.label} is documented here for inspection first. It should not be edited directly until its live binding is centralized.`;
}

function getAdminRecommendation(
  metric: MetricDefinition,
  editability: MetricRegistryEditability,
  sourceMapping: SourceMappingDefinition | null
) {
  if (editability === "developer_managed") {
    return "Expose this as inspect-only in Admin. Keep edits in code until the dashboard has a tested rules engine with previews and rollback.";
  }

  if (editability === "controlled_mapping") {
    return sourceMapping
      ? "Good candidate for structured admin overrides later. Let admins adjust mappings, thresholds, or denominator choice without exposing free-form formulas."
      : "Centralize the executable binding first, then allow narrow admin overrides on top of the code default.";
  }

  return "Keep this metric view-only for now. It needs a clearer live execution path before admin editing becomes safe.";
}
