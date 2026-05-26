import { getMetricById } from "./metricDictionary";

type TrackingGapInputs = {
  storeRevenue?: number;
  platformRevenue?: number;
  storeOrders?: number;
  platformPurchases?: number;
};

export type TrackingGapSignal = {
  ready: boolean;
  active: boolean;
  status: "unavailable" | "healthy" | "warning" | "danger";
  revenueGapRatio: number | null;
  orderGapRatio: number | null;
  summary: string;
};

export function evaluateTrackingGap(
  inputs: TrackingGapInputs
): TrackingGapSignal {
  const hasRevenueTruth =
    typeof inputs.storeRevenue === "number" &&
    typeof inputs.platformRevenue === "number";
  const hasOrderTruth =
    typeof inputs.storeOrders === "number" &&
    typeof inputs.platformPurchases === "number";

  if (!hasRevenueTruth && !hasOrderTruth) {
    return {
      ready: false,
      active: false,
      status: "unavailable",
      revenueGapRatio: null,
      orderGapRatio: null,
      summary:
        "Tracking gap needs both platform attribution and website/store truth before it can be judged.",
    };
  }

  const revenueGapRatio = hasRevenueTruth
    ? Math.abs((inputs.platformRevenue ?? 0) - (inputs.storeRevenue ?? 0)) /
      Math.max(inputs.storeRevenue ?? 0, 1)
    : null;

  const orderGapRatio = hasOrderTruth
    ? Math.abs((inputs.platformPurchases ?? 0) - (inputs.storeOrders ?? 0)) /
      Math.max(inputs.storeOrders ?? 0, 1)
    : null;

  const maxGap = Math.max(revenueGapRatio ?? 0, orderGapRatio ?? 0);

  if (maxGap >= 0.3) {
    return {
      ready: true,
      active: true,
      status: "danger",
      revenueGapRatio,
      orderGapRatio,
      summary:
        "Platform reporting is too far from website/store truth to trust attribution-sensitive decisions safely.",
    };
  }

  if (maxGap >= 0.15) {
    return {
      ready: true,
      active: true,
      status: "warning",
      revenueGapRatio,
      orderGapRatio,
      summary:
        "Platform and website/store truth are drifting enough to review before trusting aggressive scaling calls.",
    };
  }

  return {
    ready: true,
    active: false,
    status: "healthy",
    revenueGapRatio,
    orderGapRatio,
    summary:
      "Platform attribution is staying within a reasonable range of website/store truth for this view.",
  };
}

export function formatPercent(value: number | null, digits = 0) {
  if (value === null) {
    return "Not ready";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value * 100)}%`;
}

export function getMetricBenchmarkBasis(metricId: string) {
  return getMetricById(metricId)?.benchmarkBasis ?? null;
}

export function getMetricPairing(metricId: string) {
  return getMetricById(metricId)?.bestPairedWith ?? null;
}
