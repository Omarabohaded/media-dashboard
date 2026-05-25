import { evaluateMetric } from "./healthEngine";

type MetricInput = {
  id: string;
  value: number;
};

export function buildMetricCards(inputs: MetricInput[]) {
  return inputs.map((input) => evaluateMetric(input.id, input.value));
}