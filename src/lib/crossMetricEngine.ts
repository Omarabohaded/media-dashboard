type MetricInputs = {
  ctr: number;
  frequency: number;
  mer: number;
  cpc: number;
  revenueGrowth?: number;
  spendGrowth?: number;
};

type RootCauseSignal = {
  title: string;
  diagnosis: string;
  confidence: "Low" | "Medium" | "High";
  severity: "healthy" | "warning" | "danger";
  recommendation: string;
};

export function detectRootCauses(
  metrics: MetricInputs
): RootCauseSignal[] {
  const results: RootCauseSignal[] = [];

  // Creative fatigue detection
  if (
    metrics.frequency > 3 &&
    metrics.ctr < 1.2 &&
    metrics.cpc > 2
  ) {
    results.push({
      title: "Creative Fatigue Detected",
      diagnosis:
        "Audience saturation is reducing engagement efficiency.",
      confidence: "High",
      severity: "danger",
      recommendation:
        "Launch new hooks, creatives, and angles immediately.",
    });
  }

  // Scaling inefficiency
  if (
    metrics.spendGrowth &&
    metrics.revenueGrowth &&
    metrics.spendGrowth > metrics.revenueGrowth &&
    metrics.mer < 2
  ) {
    results.push({
      title: "Inefficient Scaling",
      diagnosis:
        "Spend is increasing faster than business returns.",
      confidence: "High",
      severity: "warning",
      recommendation:
        "Reduce scaling pace and stabilize MER first.",
    });
  }

  // Funnel issue
  if (
    metrics.ctr > 1.5 &&
    metrics.mer < 1.8
  ) {
    results.push({
      title: "Possible Funnel Conversion Issue",
      diagnosis:
        "Traffic quality appears healthy but conversion efficiency is weak.",
      confidence: "Medium",
      severity: "warning",
      recommendation:
        "Audit landing page, checkout flow, and offer clarity.",
    });
  }

  return results;
}