type PriorityFactors = {
  businessImpact: number;
  urgency: number;
  confidence: number;
  persistence: number;
  scope: number;
  opportunityWeight?: number;
  riskWeight?: number;
};

export function calculatePriorityScore({
  businessImpact,
  urgency,
  confidence,
  persistence,
  scope,
  opportunityWeight = 0,
  riskWeight = 0,
}: PriorityFactors) {
  const score =
    businessImpact * 0.3 +
    urgency * 0.2 +
    confidence * 0.15 +
    persistence * 0.15 +
    scope * 0.1 +
    opportunityWeight * 0.05 +
    riskWeight * 0.05;

  return Math.round(score);
}