export type TrendStatus = "improving" | "declining" | "stable" | "volatile";

export function evaluateTrend(values: number[]) {
  if (values.length < 3) {
    return {
      status: "stable" as TrendStatus,
      message: "Not enough history to evaluate trend.",
    };
  }

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const avg = (arr: number[]) =>
    arr.reduce((sum, value) => sum + value, 0) / arr.length;

  const firstAvg = avg(firstHalf);
  const secondAvg = avg(secondHalf);

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (Math.abs(change) < 5) {
    return {
      status: "stable" as TrendStatus,
      change,
      message: "Metric is stable versus recent history.",
    };
  }

  if (change > 0) {
    return {
      status: "improving" as TrendStatus,
      change,
      message: "Metric is improving versus recent history.",
    };
  }

  return {
    status: "declining" as TrendStatus,
    change,
    message: "Metric is declining versus recent history.",
  };
}