import assert from "node:assert/strict";
import test from "node:test";

const contract = await import("../src/lib/integrations/tiktokReportContract.ts");

test("event discovery uses the documented synchronous report query contract", () => {
  const query = contract.buildTikTokEventDiscoveryQuery({
    advertiserId: "adv-123",
    startDate: "2026-07-01",
    endDate: "2026-07-21",
  });

  assert.equal(query.report_type, "BASIC");
  assert.equal(query.advertiser_id, "adv-123");
  assert.deepEqual(query.dimensions, ["campaign_id"]);
  assert.deepEqual(query.metrics, [
    "spend",
    "impressions",
    "clicks",
    "conversion",
    "conversion_value",
  ]);
});

test("raw conversion metrics retain distinct purchase and value roles", () => {
  const events = contract.extractTikTokReportEvents([
    { metrics: { spend: "10", conversion: "2", conversion_value: "45" } },
  ]);

  assert.deepEqual(events.map(({ eventName, roles }) => ({ eventName, roles })), [
    { eventName: "conversion", roles: ["purchases"] },
    { eventName: "conversion_value", roles: ["purchaseValue"] },
  ]);
});

test("unreturned event metrics are not silently advertised as detected", () => {
  const events = contract.extractTikTokReportEvents([{ metrics: { spend: "10" } }]);
  assert.deepEqual(events, []);
});
