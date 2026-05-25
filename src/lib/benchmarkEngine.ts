export function calculateDynamicBenchmark(values: number[]) {
  if (!values.length) {
    return {
      healthy: 0,
      warning: 0,
      danger: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  const median =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];

  return {
    healthy: median,
    warning: median * 0.85,
    danger: median * 0.65,
  };
}