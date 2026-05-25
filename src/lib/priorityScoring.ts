import type { PriorityFactors } from "./decisionTypes";

export const PRIORITY_SCORING = {
  weights: {
    businessImpact: 0.3,
    urgency: 0.2,
    confidence: 0.15,
    persistence: 0.1,
    scope: 0.1,
    riskWeight: 0.1,
    opportunityWeight: 0.05,
  },
  scoreRanges: {
    low: [0, 39],
    medium: [40, 64],
    high: [65, 84],
    critical: [85, 100],
  },
} as const;

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
    businessImpact * PRIORITY_SCORING.weights.businessImpact +
    urgency * PRIORITY_SCORING.weights.urgency +
    confidence * PRIORITY_SCORING.weights.confidence +
    persistence * PRIORITY_SCORING.weights.persistence +
    scope * PRIORITY_SCORING.weights.scope +
    riskWeight * PRIORITY_SCORING.weights.riskWeight +
    opportunityWeight * PRIORITY_SCORING.weights.opportunityWeight;

  return Math.max(0, Math.min(100, Math.round(score)));
}