export type Severity = "healthy" | "warning" | "danger";
export type ConfidenceFlag = "Low" | "Medium" | "High";
export type PriorityLane = "risk" | "opportunity";
export type EntityLevel = "account" | "campaign" | "ad set" | "ad";

export type PriorityFactors = {
  businessImpact: number;
  urgency: number;
  confidence: number;
  persistence: number;
  scope: number;
  riskWeight?: number;
  opportunityWeight?: number;
};

export type DecisionSignal = {
  id: string;
  title: string;
  diagnosis: string;
  recommendation: string;
  severity: Severity;
  priorityFactors: PriorityFactors;
  lane: PriorityLane;
  entityLevel: EntityLevel;
  confidenceFlag?: ConfidenceFlag;
  confidenceScore?: number;
  actionType?: string;
};

export type PrioritizedSignal = DecisionSignal & {
  score: number;
  priorityLabel: "Low" | "Medium" | "High" | "Critical";
};