import type {
  MetricAdminOverride,
  MetricDenominatorChoice,
  MetricRevenueBasis,
} from "@/lib/metricRegistry";

export type StoreMetricSnapshot = {
  grossSales: number;
  netSales: number;
  ordersCount: number;
  currencyCode: string;
};

export type MetaMetricSnapshot = {
  totals: {
    spend: number;
    purchases: number;
    purchaseValue: number;
    clicks: number;
  };
};

export type DashboardMetricLogicConfig = {
  storeRevenueBasis: MetricRevenueBasis;
  aovRevenueBasis: MetricRevenueBasis;
  merRevenueBasis: MetricRevenueBasis;
  cpaDenominatorChoice: MetricDenominatorChoice;
};

export const DEFAULT_DASHBOARD_METRIC_LOGIC: DashboardMetricLogicConfig = {
  storeRevenueBasis: "gross_sales",
  aovRevenueBasis: "gross_sales",
  merRevenueBasis: "gross_sales",
  cpaDenominatorChoice: "purchases",
};

export function buildDashboardMetricLogic(
  overrides: MetricAdminOverride[]
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
  };
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
  if (!storePreview) {
    return 0;
  }

  return metricLogic.storeRevenueBasis === "net_sales"
    ? storePreview.netSales
    : storePreview.grossSales;
}

export function getEffectiveAov(
  storePreview: StoreMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  if (!storePreview || storePreview.ordersCount <= 0) {
    return null;
  }

  const revenue =
    metricLogic.aovRevenueBasis === "net_sales"
      ? storePreview.netSales
      : storePreview.grossSales;

  return revenue / storePreview.ordersCount;
}

export function getEffectiveMer(
  storePreview: StoreMetricSnapshot | null | undefined,
  metaPreview: MetaMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
  const spend = metaPreview?.totals.spend ?? 0;

  if (!storePreview || spend <= 0) {
    return null;
  }

  const revenue =
    metricLogic.merRevenueBasis === "net_sales"
      ? storePreview.netSales
      : storePreview.grossSales;

  return revenue / spend;
}

export function getEffectiveCpaCac(
  metaPreview: MetaMetricSnapshot | null | undefined,
  storePreview: StoreMetricSnapshot | null | undefined,
  metricLogic: DashboardMetricLogicConfig
) {
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
