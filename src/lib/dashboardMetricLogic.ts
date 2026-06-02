import type {
  MetricAdminOverride,
  MetricDenominatorChoice,
  MetricRevenueBasis,
} from "@/lib/metricRegistry";
import type {
  MetricFormulaTemplate,
  MetricMappingOverride,
  MetricMappingSourceField,
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
  mappings: Record<string, MetricMappingOverride>;
};

export const DEFAULT_DASHBOARD_METRIC_LOGIC: DashboardMetricLogicConfig = {
  storeRevenueBasis: "gross_sales",
  aovRevenueBasis: "gross_sales",
  merRevenueBasis: "gross_sales",
  cpaDenominatorChoice: "purchases",
  mappings: {},
};

export function buildDashboardMetricLogic(
  overrides: MetricAdminOverride[],
  mappings: MetricMappingOverride[] = []
): DashboardMetricLogicConfig {
  const overrideMap = new Map(
    overrides.map((override) => [override.metricId, override])
  );

  const storeRevenueBasis =
    overrideMap.get("store_revenue")?.revenueBasis ??
    DEFAULT_DASHBOARD_METRIC_LOGIC.storeRevenueBasis;

  return {
    storeRevenueBasis,
    aovRevenueBasis:
      overrideMap.get("aov")?.revenueBasis ?? storeRevenueBasis,
    merRevenueBasis:
      overrideMap.get("mer")?.revenueBasis ?? storeRevenueBasis,
    cpaDenominatorChoice:
      overrideMap.get("cpa_cac")?.denominatorChoice ??
      DEFAULT_DASHBOARD_METRIC_LOGIC.cpaDenominatorChoice,
    mappings: buildMappingRecord(mappings),
  };
}

function buildMappingRecord(mappings: MetricMappingOverride[]) {
  return mappings.reduce<Record<string, MetricMappingOverride>>((record, mapping) => {
    if (mapping.scope === "global" && mapping.enabled !== false) {
      record[mapping.metricId] = mapping;
    }
    return record;
  }, {});
}

function getMapping(metricLogic: DashboardMetricLogicConfig, metricId: string) {
  const mapping = metricLogic.mappings?.[metricId] ?? null;
  return mapping && mapping.enabled !== false ? mapping : null;
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

function readMappedValue(
  mapping: MetricMappingOverride | null,
  storePreview: StoreMetricSnapshot | null | undefined,
  metaPreview: MetaMetricSnapshot | null | undefined
) {
  if (!mapping) return null;

  if (mapping.sourceType === "woocommerce" || mapping.sourceType === "shopify") {
    return readStoreField(storePreview, mapping.sourceField);
  }

  if (["meta", "google", "tiktok", "snap"].includes(mapping.sourceType)) {
    return readMetaField(metaPreview, mapping.sourceField);
  }

  return null;
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
  const mapping = getMapping(metricLogic, "store_revenue");
  const mappedValue = readMappedValue(mapping, storePreview, null);

  if (typeof mappedValue === "number") {
    return mappedValue;
  }

  return getRevenueByBasis(storePreview, metricLogic.storeRevenueBasis);
}

export function getEffectiveOrders(
  storePreview: StoreMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  const mapping = getMapping(metricLogic, "orders");
  const mappedValue = readMappedValue(mapping, storePreview, null);

  if (typeof mappedValue === "number") {
    return mappedValue;
  }

  return storePreview?.ordersCount ?? 0;
}

export function getEffectiveAov(
  storePreview: StoreMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  const mapping = getMapping(metricLogic, "aov");

  if (mapping?.formulaTemplate && mapping.formulaTemplate !== "none") {
    return calculateFormula(mapping.formulaTemplate, storePreview, null, metricLogic.aovRevenueBasis);
  }

  const mappedValue = readMappedValue(mapping, storePreview, null);

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
  const mapping = getMapping(metricLogic, "mer");

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
  const mapping = getMapping(metricLogic, "blended_roas");

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
  const mapping = getMapping(metricLogic, "ctr");

  if (mapping?.formulaTemplate && mapping.formulaTemplate !== "none") {
    return calculateFormula(mapping.formulaTemplate, null, metaPreview);
  }

  const clicks = metaPreview?.totals.clicks ?? 0;
  const impressions = metaPreview?.totals.impressions ?? 0;
  return impressions > 0 ? (clicks / impressions) * 100 : null;
}

export function getEffectiveCpaCac(
  metaPreview: MetaMetricSnapshot | null | undefined,
  storePreview: StoreMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  const mappedCpo = getMapping(metricLogic, "cost_per_order");
  const mappedCpa = getMapping(metricLogic, "cpa_cac");
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
        appliedDenominator: "purchases" as const,
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
