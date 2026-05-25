export type ScalingDecision = {
  status: "safe" | "cautious" | "danger";
  confidence: number;
  riskLevel: string;
  recommendedScalePercent: number;
  summary: string;
  recommendation: string;
};

type Inputs = {
  merStatus: string;
  merTrend: string;
  hasCreativeFatigue: boolean;
  revenueGrowth: number;
  spendGrowth: number;
  priorityScore: number;
  trackingMismatch?: boolean;
  businessTruthFailure?: boolean;
  checkoutFailure?: boolean;
  trafficQualityIssue?: boolean;
};

export function evaluateScaling(inputs: Inputs): ScalingDecision {
  if (
    inputs.trackingMismatch ||
    inputs.businessTruthFailure ||
    inputs.checkoutFailure
  ) {
    return {
      status: "danger",
      confidence: 20,
      riskLevel: "Critical",
      recommendedScalePercent: 0,
      summary: "Scaling is blocked until the highest-impact issue is fixed.",
      recommendation:
        "Fix tracking, business-truth, or checkout issues before any budget increase.",
    };
  }

  let confidence = 70;

  if (inputs.merStatus === "warning") {
    confidence -= 20;
  }

  if (inputs.merStatus === "danger") {
    confidence -= 40;
  }

  if (inputs.merTrend === "declining") {
    confidence -= 25;
  }

  if (inputs.hasCreativeFatigue) {
    confidence -= 20;
  }

  if (inputs.trafficQualityIssue) {
    confidence -= 15;
  }

  if (inputs.spendGrowth > inputs.revenueGrowth) {
    confidence -= 15;
  }

  if (inputs.priorityScore >= 85) {
    confidence -= 20;
  } else if (inputs.priorityScore >= 65) {
    confidence -= 10;
  }

  confidence = Math.max(0, Math.min(100, confidence));

  if (confidence >= 75) {
    return {
      status: "safe",
      confidence,
      riskLevel: "Low",
      recommendedScalePercent: 20,
      summary: "System confidence supports controlled scaling.",
      recommendation:
        "Increase budget 20-30% only if efficiency remains stable for multiple days.",
    };
  }

  if (confidence >= 45) {
    return {
      status: "cautious",
      confidence,
      riskLevel: "Medium",
      recommendedScalePercent: 10,
      summary: "Scaling is possible but risk signals exist.",
      recommendation:
        "Hold aggressive scale. If you add budget, keep it to 10-15% and monitor closely.",
    };
  }

  return {
    status: "danger",
    confidence,
    riskLevel: "High",
    recommendedScalePercent: 0,
    summary: "Scaling conditions are unsafe.",
    recommendation:
      "Focus on stabilization before increasing budgets.",
  };
}