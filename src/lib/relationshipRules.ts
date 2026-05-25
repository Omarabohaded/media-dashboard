type PriorityFactors = {
  businessImpact: number;
  urgency: number;
  confidence: number;
  persistence: number;
  scope: number;
  riskWeight?: number;
opportunityWeight?: number;
};
export const relationshipRules = [
  {
    id: "sales_up_mer_down",
    title: "Revenue growing but efficiency weakening",
    severity: "warning",
    priorityFactors: {
  businessImpact: 95,
  urgency: 90,
  confidence: 80,
  persistence: 70,
  scope: 85,
  riskWeight: 100,
},
    logic: "Store Sales up + Spend growth higher than sales growth + MER weak",
    diagnosis: "Spend is increasing faster than business growth.",
    recommendation: "Audit Google and TikTok before scaling further.",
    inputs: ["mer", "spendGrowth", "revenueGrowth"],
  },

  {
    id: "creative_fatigue",
    title: "Creative fatigue risk",
    severity: "danger",
    priorityFactors: {
  businessImpact: 72,
  urgency: 80,
  confidence: 70,
  persistence: 65,
  scope: 70,
  riskWeight: 85,
},
    logic: "Frequency high + CTR low",
    diagnosis: "Audience saturation detected with weak engagement.",
    recommendation: "Launch new hooks, angles, and creatives immediately.",
    inputs: ["frequency", "ctr"],
  },

  {
    id: "funnel_issue",
    title: "Traffic quality or funnel issue",
    severity: "warning",
    priorityFactors: {
  businessImpact: 64,
  urgency: 70,
  confidence: 70,
  persistence: 60,
  scope: 65,
  riskWeight: 75,
},
    logic: "CTR healthy + CVR weak",
    diagnosis: "Ads are attracting clicks but users are not converting.",
    recommendation: "Review landing page, offer, checkout, and product positioning.",
    inputs: ["ctr", "cvr"],
  },

  {
    id: "safe_scaling",
    title: "Safe scaling opportunity",
    severity: "healthy",
    priorityFactors: {
  businessImpact: 45,
  urgency: 35,
  confidence: 80,
  persistence: 60,
  scope: 70,
  opportunityWeight: 80,
},
    logic: "MER healthy + ROAS healthy + NCAC controlled",
    diagnosis: "Account efficiency is stable across acquisition and blended performance.",
    recommendation: "Scale Meta gradually by 10-15%.",
    inputs: ["mer", "roas", "ncac"],
  },
] as const;