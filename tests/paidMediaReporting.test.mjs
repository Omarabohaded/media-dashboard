import assert from "node:assert/strict";
import test from "node:test";

const { buildBlendedPaidMediaReport } = await import("../src/lib/paidMediaContract.ts");

function row(sourceType, spend, purchaseValue) {
  return {
    sourceType,
    channel: sourceType,
    spend,
    purchaseValue,
    impressions: 1000,
    clicks: 50,
    purchases: 2,
    clientId: "client-1",
    dateRange: { datePreset: "last_7d" },
    conversionMappingStatus: "mapped",
    purchasesEvent: "purchase",
    purchaseValueEvent: "purchase_value",
  };
}

test("keeps channel totals distinct and calculates one blended total", () => {
  const report = buildBlendedPaidMediaReport([
    row("meta", 100, 400),
    row("tiktok", 50, 100),
  ]);

  assert.equal(report.channels.length, 2);
  assert.equal(report.blended.spend, 150);
  assert.equal(report.blended.purchaseValue, 500);
  assert.equal(report.blended.roas, 500 / 150);
});

test("included-channel configuration excludes rows without double counting", () => {
  const report = buildBlendedPaidMediaReport(
    [row("meta", 100, 400), row("tiktok", 50, 100)],
    ["meta"]
  );

  assert.equal(report.rows.length, 1);
  assert.equal(report.blended.spend, 100);
  assert.equal(report.channels.find((channel) => channel.sourceType === "tiktok").spend, 50);
});
