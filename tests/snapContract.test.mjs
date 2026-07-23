import assert from "node:assert/strict";
import test from "node:test";
const contract = await import("../src/lib/integrations/snapContract.ts");
test("stats query requests only base metrics and exact mapped conversions", () => {
  const query = contract.buildSnapStatsQuery({ purchasesEvent: "conversion_purchases", purchaseValueEvent: "conversion_purchases_value", since: "2026-07-01", until: "2026-07-07" });
  assert.equal(query.get("fields"), "impressions,swipes,spend,conversion_purchases,conversion_purchases_value");
});
test("normalization uses micro-currency and exact fields", () => {
  const rows = contract.normalizeSnapCampaignStats([{ id: "campaign-1", stats: { spend: 2500000, impressions: 1000, swipes: 50, conversion_purchases: 4, conversion_purchases_value: 120000000, unrelated: 999 } }], { clientId: "client-1", purchasesEvent: "conversion_purchases", purchaseValueEvent: "conversion_purchases_value", mappingStatus: "mapped", since: "2026-07-01", until: "2026-07-07" });
  assert.equal(rows[0].spend, 2.5); assert.equal(rows[0].purchases, 4); assert.equal(rows[0].purchaseValue, 120);
});
test("missing mappings never substitute unrelated metrics", () => {
  const rows = contract.normalizeSnapCampaignStats([{ id: "1", stats: { unrelated: 99 } }], { clientId: "client-1", purchasesEvent: null, purchaseValueEvent: null, mappingStatus: "missing_mapping", since: "2026-07-01", until: "2026-07-07" });
  assert.equal(rows[0].purchases, 0); assert.equal(rows[0].purchaseValue, 0);
});
