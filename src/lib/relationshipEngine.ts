import type { DecisionSignal } from "./decisionTypes";
import { relationshipRules } from "./relationshipRules";

type RelationshipInputs = {
  mer?: number;
  ctr?: number;
  cvr?: number;
  roas?: number;
  ncac?: number;
  frequency?: number;
  spendGrowth?: number;
  revenueGrowth?: number;
  bounceRate?: number;
  sessionDuration?: number;
  checkoutCompletionRate?: number;
  backendConversions?: number;
  platformConversions?: number;
  trackingMismatch?: boolean;
  checkoutFailure?: boolean;
  merBelowThreshold?: boolean;
};

export function evaluateRelationships(
  inputs: RelationshipInputs
): DecisionSignal[] {
  const results: DecisionSignal[] = [];
  const addRule = (id: string) => {
    const rule = relationshipRules.find((item) => item.id === id);
    if (rule) {
      results.push(rule);
    }
  };

  if (
    typeof inputs.revenueGrowth === "number" &&
    typeof inputs.spendGrowth === "number" &&
    typeof inputs.mer === "number"
  ) {
    if (
      inputs.revenueGrowth > 0 &&
      inputs.spendGrowth > inputs.revenueGrowth &&
      (inputs.mer < 2.2 || inputs.merBelowThreshold)
    ) {
      addRule("sales_up_mer_down");
    }
  }

  if (
    typeof inputs.frequency === "number" &&
    typeof inputs.ctr === "number"
  ) {
    if (inputs.frequency > 2.5 && inputs.ctr < 1) {
      addRule("creative_fatigue");
    }
  }

  if (
    typeof inputs.ctr === "number" &&
    typeof inputs.cvr === "number"
  ) {
    if (
      inputs.ctr > 2 &&
      inputs.cvr < 1 &&
      (typeof inputs.bounceRate !== "number" || inputs.bounceRate > 55)
    ) {
      addRule("traffic_quality_issue");
    }
  }

  if (
    inputs.checkoutFailure ||
    (typeof inputs.checkoutCompletionRate === "number" &&
      inputs.checkoutCompletionRate < 35)
  ) {
    addRule("checkout_failure");
  }

  const hasConversionGap =
    typeof inputs.backendConversions === "number" &&
    typeof inputs.platformConversions === "number" &&
    Math.abs(inputs.backendConversions - inputs.platformConversions) >=
      Math.max(25, inputs.backendConversions * 0.2);

  if (inputs.trackingMismatch || hasConversionGap) {
    addRule("tracking_mismatch");
  }

  if (
    typeof inputs.mer === "number" &&
    typeof inputs.roas === "number" &&
    typeof inputs.ncac === "number"
  ) {
    if (
      inputs.mer >= 3 &&
      inputs.roas >= 4 &&
      inputs.ncac < 120 &&
      !inputs.trackingMismatch &&
      !inputs.checkoutFailure &&
      !inputs.merBelowThreshold
    ) {
      addRule("safe_scaling_opportunity");
    }
  }

  return results;
}