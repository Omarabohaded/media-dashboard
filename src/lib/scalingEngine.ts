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
};

export function evaluateScaling(inputs: Inputs): ScalingDecision {
  let confidence = 100;

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

  if (inputs.spendGrowth > inputs.revenueGrowth) {
    confidence -= 15;
  }

  if (inputs.priorityScore >= 100) {
    confidence -= 20;
  }

  confidence = Math.max(0, Math.min(100, confidence));

  if (confidence >= 75) {
    return {
      status: "safe",
      confidence,
      riskLevel: "Low",
      recommendedScalePercent: 15,
      summary: "System confidence supports scaling.",
      recommendation:
        "Scale gradually while monitoring MER and creative stability.",
    };
  }

  if (confidence >= 45) {
    return {
      status: "cautious",
      confidence,
      riskLevel: "Low",
      recommendedScalePercent: 15,
      summary: "Scaling is possible but risk signals exist.",
      recommendation:
        "Stabilize efficiency and creative performance before aggressive scaling.",
    };
  }

  return {
    status: "danger",
    confidence,
    riskLevel: "Low",
    recommendedScalePercent: 15,
    summary: "Scaling conditions are unsafe.",
    recommendation:
      "Focus on stabilization before increasing budgets.",
  };
}