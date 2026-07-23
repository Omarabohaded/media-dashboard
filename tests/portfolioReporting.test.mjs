import assert from "node:assert/strict";
import test from "node:test";
const { summarizePortfolioPaidMedia } = await import("../src/lib/portfolioReporting.ts");
test("portfolio summary preserves client and channel boundaries", () => {
  const report = (id, rows, issues = []) => ({ client: { id, name: id, currencyCode: "USD" }, rows, issues, blended: { spend: rows.length ? 10 : 0 }, channels: rows.length ? [{ sourceType: "meta", spend: 10 }] : [] });
  const result = summarizePortfolioPaidMedia([report("a", [{}]), report("b", [], [{ sourceType: "snap", message: "missing" }])]);
  assert.equal(result.summary.clients, 2);
  assert.equal(result.summary.reportingClients, 1);
  assert.equal(result.summary.clientsNeedingAction, 1);
  assert.equal(result.clients[0].clientId, "a");
});
