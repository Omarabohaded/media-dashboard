import { relationshipRules } from "./relationshipRules";
type RelationshipResult = {
  title: string;
  severity: "healthy" | "warning" | "danger";
  diagnosis: string;
  recommendation: string;
  priorityFactors: any;
};

type RelationshipInputs = {
  mer?: number;
  ctr?: number;
  cvr?: number;
  roas?: number;
  ncac?: number;
  frequency?: number;
  spendGrowth?: number;
  revenueGrowth?: number;
};

export function evaluateRelationships(
  inputs: RelationshipInputs
): RelationshipResult[] {
  const results: RelationshipResult[] = [];

  // Revenue up but MER down
  if (
    inputs.revenueGrowth &&
    inputs.spendGrowth &&
    inputs.mer
  ) {
    if (
      inputs.revenueGrowth > 0 &&
      inputs.spendGrowth > inputs.revenueGrowth &&
      inputs.mer < 2.2
    ) {
const rule = relationshipRules.find(
  (rule) => rule.id === "sales_up_mer_down"
);

if (rule) {
  results.push({
    title: rule.title,
    severity: rule.severity,
    diagnosis: rule.diagnosis,
    recommendation: rule.recommendation,
    priorityFactors: rule.priorityFactors,
  });
}
    }
  }

  // Creative fatigue
  if (
    inputs.frequency &&
    inputs.ctr
  ) {
    if (
      inputs.frequency > 2.5 &&
      inputs.ctr < 1
    ) {
      const rule = relationshipRules.find(
  (rule) => rule.id === "creative_fatigue"
);

if (rule) {
  results.push({
    title: rule.title,
    severity: rule.severity,
    diagnosis: rule.diagnosis,
    recommendation: rule.recommendation,
    priorityFactors: rule.priorityFactors,
  });
}
    }
  }

  // Funnel issue
  if (
    inputs.ctr &&
    inputs.cvr
  ) {
    if (
      inputs.ctr > 2 &&
      inputs.cvr < 1
    ) {
    const rule = relationshipRules.find(
  (rule) => rule.id === "funnel_issue"
);

if (rule) {
  results.push({
    title: rule.title,
    severity: rule.severity,
    diagnosis: rule.diagnosis,
    recommendation: rule.recommendation,
    priorityFactors: rule.priorityFactors,
  });
}
    }
  }

  // Safe scaling opportunity
  if (
    inputs.mer &&
    inputs.roas &&
    inputs.ncac
  ) {
    if (
      inputs.mer >= 3 &&
      inputs.roas >= 4 &&
      inputs.ncac < 120
    ) {
    const rule = relationshipRules.find(
  (rule) => rule.id === "safe_scaling"
);

if (rule) {
  results.push({
    title: rule.title,
    severity: rule.severity,
    diagnosis: rule.diagnosis,
    recommendation: rule.recommendation,
    priorityFactors: rule.priorityFactors,
  });
}
    }
  }

  return results;
}