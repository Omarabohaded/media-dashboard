import type { Severity } from "./decisionTypes";

type MetricInputs = {
  ctr: number;
  frequency: number;
  mer: number;
  cpc: number;
  cvr?: number;
  bounceRate?: number;
  sessionDuration?: number;
  lpCvr?: number;
  atcRate?: number;
  checkoutRate?: number;
  purchaseCvr?: number;
  revenueGrowth?: number;
  spendGrowth?: number;
  backendConversions?: number;
  platformConversions?: number;
};

type RootCauseSignal = {
  id: string;
  title: string;
  diagnosis: string;
  confidence: "Low" | "Medium" | "High";
  severity: Severity;
  recommendation: string;
};

function severityFromConfidence(confidence: RootCauseSignal["confidence"]): Severity {
  if (confidence === "High") {
    return "danger";
  }

  if (confidence === "Medium") {
    return "warning";
  }

  return "healthy";
}

export function detectRootCauses(
  metrics: MetricInputs
): RootCauseSignal[] {
  const results: RootCauseSignal[] = [];

  if (
    metrics.frequency > 2.5 &&
    metrics.ctr < 1.2 &&
    metrics.cpc > 2 &&
    (!metrics.cvr || metrics.cvr < 1.2)
  ) {
    const confidence =
      metrics.frequency > 3 && metrics.cpc > 2.2 ? "High" : "Medium";
    results.push({
      id: "creative_fatigue",
      title: "Creative Fatigue Detected",
      diagnosis:
        "Audience saturation is reducing engagement efficiency.",
      confidence,
      severity: severityFromConfidence(confidence),
      recommendation:
        "Launch new hooks, creatives, and angles immediately.",
    });
  }

  if (
    metrics.ctr > 1.8 &&
    (metrics.cvr ?? 0) < 1 &&
    (metrics.bounceRate ?? 0) > 55
  ) {
    results.push({
      id: "traffic_quality_issue",
      title: "Traffic Quality Issue",
      diagnosis:
        "Ads are earning clicks, but visitor quality is weak once users land.",
      confidence: "High",
      severity: "danger",
      recommendation:
        "Refine targeting, clean up placements, and tighten creative-to-landing alignment.",
    });
  }

  if (
    metrics.ctr > 1.5 &&
    metrics.cpc < 2.5 &&
    ((metrics.purchaseCvr ?? 999) < 1 || (metrics.checkoutRate ?? 999) < 35)
  ) {
    results.push({
      id: "funnel_issue",
      title: "Funnel Issue",
      diagnosis:
        "Traffic is getting through, but downstream conversion is breaking in the funnel.",
      confidence: "High",
      severity: "danger",
      recommendation:
        "Audit landing-page clarity, checkout friction, offer strength, and site speed.",
    });
  }

  if (
    typeof metrics.spendGrowth === "number" &&
    typeof metrics.revenueGrowth === "number" &&
    metrics.spendGrowth > metrics.revenueGrowth &&
    metrics.mer < 2
  ) {
    results.push({
      id: "inefficient_scaling",
      title: "Inefficient Scaling",
      diagnosis:
        "Spend is increasing faster than business returns.",
      confidence: "High",
      severity: "warning",
      recommendation:
        "Reduce scaling pace and stabilize MER first.",
    });
  }

  if (
    typeof metrics.backendConversions === "number" &&
    typeof metrics.platformConversions === "number" &&
    Math.abs(metrics.backendConversions - metrics.platformConversions) >
      Math.max(20, metrics.backendConversions * 0.2)
  ) {
    results.push({
      id: "tracking_issue",
      title: "Tracking Issue",
      diagnosis:
        "Backend truth and platform reporting are diverging enough to distort decisions.",
      confidence: "High",
      severity: "danger",
      recommendation:
        "Audit pixel, CAPI, deduplication, and attribution overlap before scaling.",
    });
  }

  return results;
}