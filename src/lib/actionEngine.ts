type ActionItem = {
  title: string;
  priority: string;
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
if (signal.title.toLowerCase().includes("mer")) {
  actions.push({
    title: "Protect MER",
    priority: signal.priorityLabel,
    severity: signal.severity,
    recommendation: "Reduce scaling pressure until efficiency stabilizes.",
    reason: signal.diagnosis,
    expectedImpact: "Protect blended profitability and reduce waste.",
    score: signal.score,
confidence: signal.score >= 100 ? "High" : "Medium",
actionType: "Protect",
  });
}
if (signal.title.toLowerCase().includes("creative")) {
  actions.push({
    title: "Refresh Creatives",
    priority: signal.priorityLabel,
    severity: signal.severity,
    recommendation: "Launch 3-5 new hooks and angles immediately.",
    reason: signal.diagnosis,
    expectedImpact: "Improve CTR and lower fatigue pressure.",
    score: signal.score,
confidence: signal.score >= 100 ? "High" : "Medium",
actionType: "Protect",
  });
}
if (signal.title.toLowerCase().includes("funnel")) {
  actions.push({
    title: "Audit Funnel",
    priority: signal.priorityLabel,
    severity: signal.severity,
    recommendation: "Review landing page, checkout flow, and offer clarity.",
    reason: signal.diagnosis,
    expectedImpact: "Increase CVR and improve conversion efficiency.",
    score: signal.score,
confidence: signal.score >= 100 ? "High" : "Medium",
actionType: "Protect",
  });
}
  });
actions.sort((a, b) => {
  const priorityOrder = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  return (
    priorityOrder[b.priority as keyof typeof priorityOrder] -
    priorityOrder[a.priority as keyof typeof priorityOrder]
  );
});
  return actions;
}