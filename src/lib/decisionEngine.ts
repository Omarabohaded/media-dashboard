export function buildDecisionFeed(signals: any[]) {
  if (!signals.length) {
    return {
      headline: "No major issues detected",
      summary: "Account conditions are stable.",
      primaryAction: "Continue monitoring performance.",
    };
  }

  const topSignal = signals[0];

  return {
    headline: topSignal.title,
    summary: topSignal.diagnosis,
    primaryAction: topSignal.recommendation,
  };
}