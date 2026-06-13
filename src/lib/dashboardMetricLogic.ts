import type {
  MetricAdminOverride,
  MetricChannel,
  MetricDenominatorChoice,
  MetricRevenueBasis,
} from "@/lib/metricRegistry";
import type {
  MetricFormulaTemplate,
  MetricMappingAggregation,
  MetricMappingFilterPreset,
  MetricMappingOverride,
  MetricMappingSourceField,
  MetricMappingSourceType,
} from "@/lib/metricMappingStore";

export type StoreMetricSnapshot = {
  grossSales: number;
  netSales: number;
  ordersCount: number;
  currencyCode: string;
  taxTotal?: number;
  shippingTotal?: number;
  averageOrderValue?: number;
};

export type MetaMetricSnapshot = {
  totals: {
    spend: number;
    purchases: number;
    purchaseValue: number;
    clicks: number;
    impressions?: number;
  };
};

export type DashboardMetricLogicConfig = {
  storeRevenueBasis: MetricRevenueBasis;
  aovRevenueBasis: MetricRevenueBasis;
  merRevenueBasis: MetricRevenueBasis;
  cpaDenominatorChoice: MetricDenominatorChoice;
  activeClientId: string | null;
  includedChannels: Record<string, MetricChannel[]>;
  mappings: Record<string, MetricMappingOverride>;
};

export type DashboardMetricLogicOptions = {
  clientId?: string | null;
};

export const DEFAULT_DASHBOARD_METRIC_LOGIC: DashboardMetricLogicConfig = {
  storeRevenueBasis: "gross_sales",
  aovRevenueBasis: "gross_sales",
  merRevenueBasis: "gross_sales",
  cpaDenominatorChoice: "purchases",
  activeClientId: null,
  includedChannels: {},
  mappings: {},
};

export function buildDashboardMetricLogic(
  overrides: MetricAdminOverride[],
  mappings: MetricMappingOverride[] = [],
  options: DashboardMetricLogicOptions = {}
): DashboardMetricLogicConfig {
  const overrideMap = new Map(
    overrides.map((override) => [override.metricId, override])
  );

  const storeRevenueBasis =
    overrideMap.get("store_revenue")?.revenueBasis ??
    DEFAULT_DASHBOARD_METRIC_LOGIC.storeRevenueBasis;

  const activeClientId = options.clientId?.trim() || null;

  return {
    storeRevenueBasis,
    aovRevenueBasis:
      overrideMap.get("aov")?.revenueBasis ?? storeRevenueBasis,
    merRevenueBasis:
      overrideMap.get("mer")?.revenueBasis ?? storeRevenueBasis,
    cpaDenominatorChoice:
      overrideMap.get("cpa_cac")?.denominatorChoice ??
      DEFAULT_DASHBOARD_METRIC_LOGIC.cpaDenominatorChoice,
    activeClientId,
    includedChannels: buildIncludedChannelRecord(overrides),
    mappings: buildMappingRecord(mappings, activeClientId),
  };
}

function buildIncludedChannelRecord(overrides: MetricAdminOverride[]) {
  return overrides.reduce<Record<string, MetricChannel[]>>((record, override) => {
    if (override.includedChannels?.length) {
      record[override.metricId] = [...override.includedChannels];
    }
    return record;
  }, {});
}

function buildMappingRecord(
  mappings: MetricMappingOverride[],
  activeClientId: string | null
) {
  return mappings.reduce<Record<string, MetricMappingOverride>>((record, mapping) => {
    if (mapping.enabled === false) return record;

    if (mapping.scope === "global") {
      record[mapping.metricId] = mapping;
      return record;
    }

    if (activeClientId && mapping.scope === "client" && mapping.clientId === activeClientId) {
      record[mapping.metricId] = mapping;
    }

    return record;
  }, {});
}

function getMapping(metricLogic: DashboardMetricLogicConfig, metricId: string) {
  const mapping = metricLogic.mappings?.[metricId] ?? null;
  return mapping && mapping.enabled !== false ? mapping : null;
}

function isChannelIncluded(
  metricLogic: DashboardMetricLogicConfig,
  metricId: string,
  channel: MetricChannel
) {
  const channels = metricLogic.includedChannels?.[metricId] ?? [];
  return channels.length === 0 || channels.includes(channel);
}

function isSourceTypeIncluded(
  metricLogic: DashboardMetricLogicConfig,
  metricId: string,
  sourceType: MetricMappingSourceType
) {
  if (sourceType === "meta" || sourceType === "google" || sourceType === "tiktok" || sourceType === "snap") {
    return isChannelIncluded(metricLogic, metricId, sourceType);
  }

  return true;
}

function readStoreField(
  storePreview: StoreMetricSnapshot | null | undefined,
  field: MetricMappingSourceField
) {
  if (!storePreview) return null;

  if (field === "grossSales") return storePreview.grossSales;
  if (field === "netSales") return storePreview.netSales;
  if (field === "ordersCount") return storePreview.ordersCount;
  if (field === "averageOrderValue") {
    return storePreview.averageOrderValue ??
      (storePreview.ordersCount > 0 ? storePreview.grossSales / storePreview.ordersCount : null);
  }
  if (field === "taxTotal") return storePreview.taxTotal ?? null;
  if (field === "shippingTotal") return storePreview.shippingTotal ?? null;

  return null;
}

function readMetaField(
  metaPreview: MetaMetricSnapshot | null | undefined,
  field: MetricMappingSourceField
) {
  if (!metaPreview) return null;

  if (field === "totalAdSpend") return metaPreview.totals.spend;
  if (field === "platformPurchaseValue") return metaPreview.totals.purchaseValue;
  if (field === "purchases") return metaPreview.totals.purchases;
  if (field === "clicks") return metaPreview.totals.clicks;
  if (field === "impressions") return metaPreview.totals.impressions ?? null;

  return null;
}

function isFilterPresetConsumable(
  preset: MetricMappingFilterPreset,
  sourceType: MetricMappingSourceType
) {
  if (preset === "none" || preset === "selected_reporting_window") return true;
  if (preset === "all_orders") return sourceType === "woocommerce" || sourceType === "shopify";
  if (preset === "completed_orders" || preset === "paid_orders") {
    return sourceType === "woocommerce" || sourceType === "shopify";
  }
  if (preset === "active_campaigns") {
    return sourceType === "meta" || sourceType === "google" || sourceType === "tiktok" || sourceType === "snap";
  }
  return true;
}

function applyFilterPreset(
  preset: MetricMappingFilterPreset,
  sourceType: MetricMappingSourceType,
  value: number | null
) {
  if (typeof value !== "number") return null;

  if (!isFilterPresetConsumable(preset, sourceType)) {
    return value;
  }

  // Phase 4A intentionally consumes filter presets without forcing source-level
  // filtering that the current snapshots cannot prove yet. Reporting-window
  // filtering is already applied by source fetchers, while order/campaign status
  // presets remain future-ready until row-level status data is connected.
  return value;
}

function applyMappedAggregation(
  value: number | null,
  aggregation: MetricMappingAggregation
) {
  if (typeof value !== "number") return null;

  if (
    aggregation === "sum" ||
    aggregation === "average" ||
    aggregation === "ratio" ||
    aggregation === "rule"
  ) {
    return value;
  }

  if (aggregation === "count") {
    return value;
  }

  return value;
}

function readMappedValue(
  mapping: MetricMappingOverride | null,
  storePreview: StoreMetricSnapshot | null | undefined,
  metaPreview: MetaMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig,
  metricId: string
) {
  if (!mapping || !isSourceTypeIncluded(metricLogic, metricId, mapping.sourceType)) {
    return null;
  }

  let value: number | null = null;

  if (mapping.sourceType === "woocommerce" || mapping.sourceType === "shopify") {
    value = readStoreField(storePreview, mapping.sourceField);
  } else if (["meta", "google", "tiktok", "snap"].includes(mapping.sourceType)) {
    value = readMetaField(metaPreview, mapping.sourceField);
  }

  const filteredValue = applyFilterPreset(
    mapping.filterPreset ?? "selected_reporting_window",
    mapping.sourceType,
    value
  );

  return applyMappedAggregation(filteredValue, mapping.aggregation ?? "none");
}

function getRevenueByBasis(
  storePreview: StoreMetricSnapshot | null | undefined,
  basis: MetricRevenueBasis
) {
  if (!storePreview) return 0;
  if (basis === "net_sales") return storePreview.netSales;
  return storePreview.grossSales;
}

function calculateFormula(
  formulaTemplate: MetricFormulaTemplate,
  storePreview: StoreMetricSnapshot | null | undefined,
  metaPreview: MetaMetricSnapshot | null | undefined,
  revenueBasis: MetricRevenueBasis = "gross_sales"
) {
  const revenue = getRevenueByBasis(storePreview, revenueBasis);
  const spend = metaPreview?.totals.spend ?? 0;
  const orders = storePreview?.ordersCount ?? 0;
  const purchases = metaPreview?.totals.purchases ?? 0;
  const platformValue = metaPreview?.totals.purchaseValue ?? 0;
  const clicks = metaPreview?.totals.clicks ?? 0;
  const impressions = metaPreview?.totals.impressions ?? 0;

  if (formulaTemplate === "revenue_divide_spend") return spend > 0 ? revenue / spend : null;
  if (formulaTemplate === "revenue_divide_orders") return orders > 0 ? revenue / orders : null;
  if (formulaTemplate === "spend_divide_orders") return spend > 0 && orders > 0 ? spend / orders : null;
  if (formulaTemplate === "spend_divide_purchases") return spend > 0 && purchases > 0 ? spend / purchases : null;
  if (formulaTemplate === "platform_value_divide_spend") return spend > 0 ? platformValue / spend : null;
  if (formulaTemplate === "clicks_divide_impressions") return impressions > 0 ? (clicks / impressions) * 100 : null;
  if (formulaTemplate === "spend_divide_clicks") return clicks > 0 ? spend / clicks : null;
  if (formulaTemplate === "spend_divide_impressions_times_1000") return impressions > 0 ? (spend / impressions) * 1000 : null;
  if (formulaTemplate === "purchases_divide_clicks") return clicks > 0 ? (purchases / clicks) * 100 : null;

  return null;
}

export function getRevenueBasisLabel(basis: MetricRevenueBasis) {
  if (basis === "net_sales") {
    return "Net revenue";
  }

  if (basis === "platform_purchase_value") {
    return "Platform purchase value";
  }

  return "Gross sales";
}

export function getEffectiveStoreRevenue(
  storePreview: StoreMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  const metricId = "store_revenue";
  const mapping = getMapping(metricLogic, metricId);
  const mappedValue = readMappedValue(mapping, storePreview, null, metricLogic, metricId);

  if (typeof mappedValue === "number") {
    return mappedValue;
  }

  return getRevenueByBasis(storePreview, metricLogic.storeRevenueBasis);
}

export function getEffectiveOrders(
  storePreview: StoreMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  const metricId = "orders";
  const mapping = getMapping(metricLogic, metricId);
  const mappedValue = readMappedValue(mapping, storePreview, null, metricLogic, metricId);

  if (typeof mappedValue === "number") {
    return mappedValue;
  }

  return storePreview?.ordersCount ?? 0;
}

export function getEffectiveAov(
  storePreview: StoreMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  const metricId = "aov";
  const mapping = getMapping(metricLogic, metricId);

  if (mapping?.formulaTemplate && mapping.formulaTemplate !== "none") {
    return calculateFormula(mapping.formulaTemplate, storePreview, null, metricLogic.aovRevenueBasis);
  }

  const mappedValue = readMappedValue(mapping, storePreview, null, metricLogic, metricId);

  if (typeof mappedValue === "number") {
    return mappedValue;
  }

  if (!storePreview || storePreview.ordersCount <= 0) {
    return null;
  }

  const revenue = getRevenueByBasis(storePreview, metricLogic.aovRevenueBasis);
  return revenue / storePreview.ordersCount;
}

export function getEffectiveMer(
  storePreview: StoreMetricSnapshot | null | undefined,
  metaPreview: MetaMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  const metricId = "mer";
  const mapping = getMapping(metricLogic, metricId);

  if (!isChannelIncluded(metricLogic, metricId, "meta")) {
    return null;
  }

  if (mapping?.formulaTemplate && mapping.formulaTemplate !== "none") {
    return calculateFormula(mapping.formulaTemplate, storePreview, metaPreview, metricLogic.merRevenueBasis);
  }

  const spend = metaPreview?.totals.spend ?? 0;

  if (!storePreview || spend <= 0) {
    return null;
  }

  const revenue = getRevenueByBasis(storePreview, metricLogic.merRevenueBasis);
  return revenue / spend;
}

export function getEffectiveBlendedRoas(
  metaPreview: MetaMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  const metricId = "blended_roas";
  const mapping = getMapping(metricLogic, metricId);

  if (!isChannelIncluded(metricLogic, metricId, "meta")) {
    return null;
  }

  if (mapping?.formulaTemplate && mapping.formulaTemplate !== "none") {
    return calculateFormula(mapping.formulaTemplate, null, metaPreview);
  }

  const spend = metaPreview?.totals.spend ?? 0;
  return spend > 0 ? (metaPreview?.totals.purchaseValue ?? 0) / spend : null;
}

export function getEffectiveCtr(
  metaPreview: MetaMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  const metricId = "ctr";
  const mapping = getMapping(metricLogic, metricId);

  if (!isChannelIncluded(metricLogic, metricId, "meta")) {
    return null;
  }

  if (mapping?.formulaTemplate && mapping.formulaTemplate !== "none") {
    return calculateFormula(mapping.formulaTemplate, null, metaPreview);
  }

  const clicks = metaPreview?.totals.clicks ?? 0;
  const impressions = metaPreview?.totals.impressions ?? 0;
  return impressions > 0 ? (clicks / impressions) * 100 : null;
}

export function getEffectiveCpc(
  metaPreview: MetaMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  const metricId = "cpc";
  const mapping = getMapping(metricLogic, metricId);

  if (!isChannelIncluded(metricLogic, metricId, "meta")) {
    return null;
  }

  if (mapping?.formulaTemplate && mapping.formulaTemplate !== "none") {
    return calculateFormula(mapping.formulaTemplate, null, metaPreview);
  }

  const mappedValue = readMappedValue(mapping, null, metaPreview, metricLogic, metricId);
  if (typeof mappedValue === "number") return mappedValue;

  const spend = metaPreview?.totals.spend ?? 0;
  const clicks = metaPreview?.totals.clicks ?? 0;
  return clicks > 0 ? spend / clicks : null;
}

export function getEffectiveCpm(
  metaPreview: MetaMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  const metricId = "cpm";
  const mapping = getMapping(metricLogic, metricId);

  if (!isChannelIncluded(metricLogic, metricId, "meta")) {
    return null;
  }

  if (mapping?.formulaTemplate && mapping.formulaTemplate !== "none") {
    return calculateFormula(mapping.formulaTemplate, null, metaPreview);
  }

  const mappedValue = readMappedValue(mapping, null, metaPreview, metricLogic, metricId);
  if (typeof mappedValue === "number") return mappedValue;

  const spend = metaPreview?.totals.spend ?? 0;
  const impressions = metaPreview?.totals.impressions ?? 0;
  return impressions > 0 ? (spend / impressions) * 1000 : null;
}

export function getEffectiveCpaCac(
  metaPreview: MetaMetricSnapshot | null | undefined,
  storePreview: StoreMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  const mappedCpo = getMapping(metricLogic, "cost_per_order");
  const mappedCpa = getMapping(metricLogic, "cpa_cac");
  const effectiveMetricId = mappedCpo ? "cost_per_order" : "cpa_cac";

  if (!isChannelIncluded(metricLogic, effectiveMetricId, "meta")) {
    return {
      value: null,
      appliedDenominator: mappedCpo ? "orders" as const : metricLogic.cpaDenominatorChoice,
      blockedReason: "Meta is excluded from this metric's included channels.",
    };
  }

  const formulaResult = calculateFormula(
    mappedCpo?.formulaTemplate && mappedCpo.formulaTemplate !== "none"
      ? mappedCpo.formulaTemplate
      : mappedCpa?.formulaTemplate && mappedCpa.formulaTemplate !== "none"
      ? mappedCpa.formulaTemplate
      : "none",
    storePreview,
    metaPreview
  );

  if (formulaResult !== null) {
    return {
      value: formulaResult,
      appliedDenominator: mappedCpo ? "orders" as const : metricLogic.cpaDenominatorChoice,
      blockedReason: null,
    };
  }

  const spend = metaPreview?.totals.spend ?? 0;

  if (spend <= 0) {
    return {
      value: null,
      appliedDenominator: metricLogic.cpaDenominatorChoice,
      blockedReason: "Spend is not available yet.",
    };
  }

  if (metricLogic.cpaDenominatorChoice === "orders") {
    const orders = storePreview?.ordersCount ?? 0;
    return orders > 0
      ? {
          value: spend / orders,
          appliedDenominator: "orders" as const,
          blockedReason: null,
        }
      : {
          value: null,
          appliedDenominator: "orders" as const,
          blockedReason:
            "Orders-based CAC needs store truth before it can be applied live.",
        };
  }

  if (metricLogic.cpaDenominatorChoice === "new_customers") {
    return {
      value: null,
      appliedDenominator: "new_customers" as const,
      blockedReason:
        "New-customer CAC is saved in the metric logic, but live new-customer truth is not connected yet.",
    };
  }

  const purchases = metaPreview?.totals.purchases ?? 0;
  return purchases > 0
    ? {
        value: spend / purchases,
        appliedDenominator: "purchases" as const,
        blockedReason: null,
      }
    : {
        value: null,
        appliedDenominator: "purchases",
        blockedReason: "Purchases are not available yet.",
      };
}

export function getCpaDenominatorLabel(choice: MetricDenominatorChoice) {
  if (choice === "new_customers") {
    return "New customers";
  }

  if (choice === "begin_checkout") {
    return "Begin checkout";
  }

  if (choice === "add_to_cart") {
    return "Add to cart";
  }

  return choice
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
