import { calculatePriorityScore } from "./priorityScoring";
import type { DecisionSignal, PrioritizedSignal } from "./decisionTypes";

export function prioritizeSignals(
  signals: DecisionSignal[]
): PrioritizedSignal[] {
  const hasRiskSignals = signals.some((signal) => signal.lane === "risk");

  return signals
    .map((signal) => {
      let score = calculatePriorityScore(signal.priorityFactors);

      if (signal.lane === "opportunity" && hasRiskSignals) {
        score = Math.min(score, 59);
      }

      let priorityLabel: PrioritizedSignal["priorityLabel"] = "Low";

      if (score >= 85) {
        priorityLabel = "Critical";
      } else if (score >= 65) {
        priorityLabel = "High";
      } else if (score >= 40) {
        priorityLabel = "Medium";
      }

      return {
        ...signal,
        score,
        priorityLabel,
      };
    })
    .sort((a, b) => {
      if (a.lane !== b.lane) {
        return a.lane === "risk" ? -1 : 1;
      }

      const entityRank = {
        account: 4,
        campaign: 3,
        "ad set": 2,
        ad: 1,
      };

      return (
        b.score - a.score ||
        entityRank[b.entityLevel] - entityRank[a.entityLevel]
      );
    });
}