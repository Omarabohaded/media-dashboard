import assert from "node:assert/strict";
import test from "node:test";

const { mergePortfolioPaidMedia } = await import("../src/lib/portfolioMerge.ts");

const baseCard = {
  websitePlatform: "shopify",
  adSpend: null,
  websiteSales: 100,
  roas: null,
  orders: 1,
  aov: 100,
  costPerOrder: null,
  status: "partial",
  storeConnected: true,
  metaConnected: false,
  storeSourceLabel: "Shopify",
  metaSourceLabel: "Paid media unavailable",
  issues: ["Meta is not connected"],
};

test("portfolio merge recalculates readiness and preserves currency boundaries", () => {
  const result = mergePortfolioPaidMedia(
    [
      {
        ...baseCard,
        clientId: "aed",
        storeName: "AED Client",
        currencyCode: "AED",
      },
      {
        ...baseCard,
        clientId: "usd",
        storeName: "USD Client",
        currencyCode: "USD",
      },
    ],
    [
      {
        clientId: "aed",
        blended: { spend: 25, roas: 4 },
        channels: [{ sourceType: "google" }],
        issues: [],
      },
      {
        clientId: "usd",
        blended: { spend: 0 },
        channels: [],
        issues: [{ sourceType: "snap", message: "Missing account" }],
      },
    ]
  );

  assert.equal(result.summary.readyStores, 1);
  assert.equal(result.summary.partialStores, 1);
  assert.deepEqual(result.summary.currencies, ["AED", "USD"]);
  assert.equal(result.cards[0].adSpend, 25);
  assert.equal(result.cards[0].metaSourceLabel, "google");
  assert.equal(result.cards[1].issues[0], "snap: Missing account");
});
