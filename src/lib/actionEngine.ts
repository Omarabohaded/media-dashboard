type ActionItem = {
  id: string;
  title: string;
  priority: string;
  lane: "risk" | "opportunity";
  severity: "healthy" | "warning" | "danger";
  recommendation: string;
  reason: string;
  expectedImpact: string;
  score: number;
  confidence: string;
  actionType: string;
};

export function generateActions(signals: any[]): ActionItem[] {
  const actions: ActionItem[] = [];

  signals.forEach((signal) => {
    const baseAction = {
      id: signal.id,
      priority: signal.priorityLabel,
      lane: signal.lane,
      severity: signal.severity,
      reason: signal.diagnosis,
      score: signal.score,
      confidence: signal.confidenceFlag ?? (signal.score >= 85 ? "High" : "Medium"),
      actionType: signal.actionType ?? (signal.lane === "risk" ? "Protect" : "Scale"),
    };

    if (signal.id === "sales_up_mer_down") {
      actions.push({
        ...baseAction,
        title: "Protect MER",
        recommendation: "Reduce scaling pressure and shift spend toward channels with stronger business truth alignment.",
        expectedImpact: "Protect blended profitability and reduce margin-damaging growth.",
      });
    }

    if (signal.id === "creative_fatigue") {
      actions.push({
        ...baseAction,
        title: "Refresh Creatives",
        recommendation: "Launch 3-5 new creatives, change the first 3 seconds, and rotate fresh angles.",
        expectedImpact: "Improve CTR, lower fatigue pressure, and restore delivery efficiency.",
      });
    }

    if (signal.id === "traffic_quality_issue") {
      actions.push({
        ...baseAction,
        title: "Improve Traffic Quality",
        recommendation: "Refine targeting, exclude weak placements, and tighten message-to-landing alignment.",
        expectedImpact: "Lift conversion quality and cut wasted spend from low-intent clicks.",
      });
    }

    if (signal.id === "checkout_failure") {
      actions.push({
        ...baseAction,
        title: "Fix Checkout Before Scaling",
        recommendation: "Audit payment steps, form friction, load speed, and trust blockers before adding budget.",
        expectedImpact: "Recover bottom-funnel revenue and stop budget from feeding a broken checkout.",
      });
    }

    if (signal.id === "tracking_mismatch") {
      actions.push({
        ...baseAction,
        title: "Validate Tracking",
        recommendation: "Audit pixel, CAPI, deduplication, and backend conversion reconciliation.",
        expectedImpact: "Restore trust in attribution and prevent false scale recommendations.",
      });
    }

    if (signal.id === "safe_scaling_opportunity") {
      actions.push({
        ...baseAction,
        title: "Scale Winning Campaigns",
        recommendation: "Increase budgets 10-15% first, then widen audiences gradually if efficiency holds.",
        expectedImpact: "Capture incremental spend while preserving efficiency discipline.",
      });
    }
  });

  actions.sort((a, b) => {
    if (a.lane !== b.lane) {
      return a.lane === "risk" ? -1 : 1;
    }

    const priorityOrder = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return (
      priorityOrder[b.priority as keyof typeof priorityOrder] -
        priorityOrder[a.priority as keyof typeof priorityOrder] ||
      b.score - a.score
    );
  });
  return actions;
}