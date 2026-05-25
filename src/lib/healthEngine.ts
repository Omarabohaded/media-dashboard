import { calculateDynamicBenchmark } from "./benchmarkEngine";
import { metricDictionary } from "./metricDictionary";

export type MetricStatus = "healthy" | "warning" | "danger" | "unknown";
const mockAccountHistory = {
  mer: [2.6, 2.8, 3.1, 2.9, 3.0, 2.7, 3.2, 3.1, 2.95, 2.85],
};
export function evaluateMetric(metricId: string, value: number) {
  const metric = metricDictionary.metrics.find((m) => m.id === metricId);

  if (!metric) {
    return {
      status: "unknown" as MetricStatus,
      label: metricId,
      value,
      message: "Metric not found",
      action: "Check metric dictionary configuration",
    };
  }

  const healthySignal = metric.healthySignal || "";
const warningSignal = metric.warningSignal || "";

let status: MetricStatus = "unknown";

const historyValues =
  mockAccountHistory[metricId as keyof typeof mockAccountHistory];

const benchmarks = historyValues
  ? calculateDynamicBenchmark(historyValues)
  : metric.benchmarks;

if (benchmarks) {
  const healthy = Number(benchmarks.healthy);
  const warning = Number(benchmarks.warning);
const direction = metric.direction || "higher_is_better";
  if (!Number.isNaN(healthy) && !Number.isNaN(warning)) {
    if (direction === "lower_is_better") {
  if (value <= healthy) {
    status = "healthy";
  } else if (value <= warning) {
    status = "warning";
  } else {
    status = "danger";
  }
} else {
  if (value >= healthy) {
    status = "healthy";
  } else if (value >= warning) {
    status = "warning";
  } else {
    status = "danger";
  }
}
  }
}

return {
  metricId,
  label: metric.label,
  category: metric.category,
  value,
  status,
  formula: metric.formula,
  source: metric.source,
  meaning: metric.meaning,
  healthySignal:
    status === "healthy"
      ? healthySignal
      : warningSignal || healthySignal,
  warningSignal,
  benchmarks,
  action:
    status === "healthy"
      ? "Safe to scale carefully."
      : warningSignal ||
        "Review this metric against account benchmark and paired metrics.",
};
}

export function getDecisionMetrics() {
  return metricDictionary.metrics.filter(
    (metric) =>
      metric.priority === "Must Have" ||
      metric.primaryTruth === true
  );
}

export function getMetricsBySection(section: string) {
  return metricDictionary.metrics.filter(
    (metric) => metric.category === section
  );
}

export function getCustomSignals() {
  return metricDictionary.customSignals;
}