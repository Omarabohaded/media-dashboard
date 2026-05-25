const overrideHierarchy = [
  "tracking_mismatch",
  "sales_up_mer_down",
  "checkout_failure",
  "creative_fatigue",
  "traffic_quality_issue",
  "safe_scaling_opportunity",
] as const;

export function buildDecisionFeed(signals: any[]) {
  if (!signals.length) {
    return {
      headline: "No major issues detected",
      summary: "Account conditions are stable.",
      primaryAction: "Continue monitoring performance.",
    };
  }

  const topSignal = [...signals].sort((a, b) => {
    const aRank = overrideHierarchy.indexOf(a.id);
    const bRank = overrideHierarchy.indexOf(b.id);

    if (aRank !== bRank) {
      return (aRank === -1 ? 999 : aRank) - (bRank === -1 ? 999 : bRank);
    }

    return b.score - a.score;
  })[0];

  return {
    headline: topSignal.title,
    summary: topSignal.diagnosis,
    primaryAction: topSignal.recommendation,
  };
}