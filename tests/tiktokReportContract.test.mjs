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

test("paid-media query requests base metrics and exactly the mapped conversion metrics", () => {
  const query = contract.buildTikTokPaidMediaQuery({
    advertiserId: "adv-123",
    startDate: "2026-07-01",
    endDate: "2026-07-21",
    purchasesEvent: "complete_payment",
    purchaseValueEvent: "complete_payment_value",
  });

  assert.deepEqual(query.metrics, [
    "spend",
    "impressions",
    "clicks",
    "complete_payment",
    "complete_payment_value",
  ]);
  assert.equal(query.data_level, "AUCTION_CAMPAIGN");
  assert.equal(query.page_size, 1000);
});

test("paid-media query does not add missing or duplicate conversion metrics", () => {
  const query = contract.buildTikTokPaidMediaQuery({
    advertiserId: "adv-123",
    startDate: "2026-07-01",
    endDate: "2026-07-21",
    purchasesEvent: "conversion",
    purchaseValueEvent: "conversion",
  });

  assert.deepEqual(query.metrics, ["spend", "impressions", "clicks", "conversion"]);
});

test("normalization extracts only explicitly mapped conversion metrics", () => {
  const metrics = contract.extractTikTokMappedMetrics(
    {
      metrics: {
        spend: "20",
        impressions: "1000",
        clicks: "50",
        complete_payment: "4",
        complete_payment_value: "160",
        conversion: "99",
      },
    },
    {
      purchasesEvent: "complete_payment",
      purchaseValueEvent: "complete_payment_value",
    }
  );

  assert.deepEqual(metrics, {
    spend: 20,
    impressions: 1000,
    clicks: 50,
    purchases: 4,
    purchaseValue: 160,
  });
});

test("missing mappings never substitute unrelated TikTok conversion metrics", () => {
  const metrics = contract.extractTikTokMappedMetrics(
    { metrics: { spend: "20", conversion: "9", conversion_value: "900" } },
    { purchasesEvent: null, purchaseValueEvent: null }
  );

  assert.equal(metrics.purchases, 0);
  assert.equal(metrics.purchaseValue, 0);
});
