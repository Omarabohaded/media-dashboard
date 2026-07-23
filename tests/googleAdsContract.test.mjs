import assert from "node:assert/strict";
import test from "node:test";
const contract = await import("../src/lib/integrations/googleAdsContract.ts");

test("query requests only the two explicitly mapped conversion actions", () => {
  const query = contract.buildGoogleAdsCampaignQuery({
    purchasesAction: "customers/1/conversionActions/10",
    purchaseValueAction: "customers/1/conversionActions/20",
    since: "2026-07-01",
    until: "2026-07-07",
  });
  assert.match(query, /segments\.conversion_action IN/);
  assert.match(query, /conversionActions\/10/);
  assert.match(query, /conversionActions\/20/);
});

test("normalization never substitutes unrelated conversions", () => {
  const rows = contract.normalizeGoogleAdsRows([
    { campaign: { id: "1", name: "Search" }, metrics: { costMicros: "1000000", impressions: "100", clicks: "5", conversions: "9", conversionsValue: "900" }, segments: { conversionAction: "unrelated" } },
  ], {
    clientId: "client-1", purchasesAction: "purchase", purchaseValueAction: "value",
    mappingStatus: "mapped", since: "2026-07-01", until: "2026-07-07",
  });
  assert.equal(rows[0].purchases, 0);
  assert.equal(rows[0].purchaseValue, 0);
  assert.equal(rows[0].spend, 1);
});

test("distinct mapped actions populate only their assigned roles", () => {
  const rows = contract.normalizeGoogleAdsRows([
    { campaign: { id: "1" }, metrics: { costMicros: "2000000", conversions: "3", conversionsValue: "0" }, segments: { conversionAction: "purchase" } },
    { campaign: { id: "1" }, metrics: { conversions: "0", conversionsValue: "120" }, segments: { conversionAction: "value" } },
  ], {
    clientId: "client-1", purchasesAction: "purchase", purchaseValueAction: "value",
    mappingStatus: "mapped", since: "2026-07-01", until: "2026-07-07",
  });
  assert.equal(rows[0].purchases, 3);
  assert.equal(rows[0].purchaseValue, 120);
});
