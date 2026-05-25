import { calculatePriorityScore } from "./priorityScoring";
type PrioritySignal = {
  title: string;
  severity: "healthy" | "warning" | "danger";
  diagnosis: string;
  recommendation: string;
};

type PrioritizedSignal = PrioritySignal & {
  score: number;
  priorityLabel: string;
};

export function prioritizeSignals(
  signals: PrioritySignal[]
): PrioritizedSignal[] {
  return signals
    .map((signal) => {
      let priorityLabel = "Low";

const score = calculatePriorityScore(
  signal.priorityFactors
);
      // Priority labels
      if (score >= 120) {
        priorityLabel = "Critical";
      } else if (score >= 80) {
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
    .sort((a, b) => b.score - a.score);
}