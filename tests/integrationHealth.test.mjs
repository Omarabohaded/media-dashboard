import assert from "node:assert/strict";
import test from "node:test";

const { evaluateIntegrationHealth } = await import("../src/lib/integrationHealth.ts");
const base = {
  clientId: "client-1",
  clientName: "Client",
  sourceType: "tiktok",
  connected: true,
  selectedAccountId: "adv-1",
  mappingStatus: "mapped",
  tokenExpiresAt: "2026-07-24T00:00:00.000Z",
  lastSuccessfulSyncAt: "2026-07-23T08:00:00.000Z",
  lastAttemptAt: "2026-07-23T08:00:00.000Z",
  lastError: null,
  now: "2026-07-23T10:00:00.000Z",
};

test("reports a healthy fresh integration", () => {
  const result = evaluateIntegrationHealth(base);
  assert.equal(result.status, "healthy");
  assert.equal(result.dataFreshness, "fresh");
});

test("token expiry outranks mapping and freshness", () => {
  const result = evaluateIntegrationHealth({
    ...base,
    tokenExpiresAt: "2026-07-23T09:00:00.000Z",
    mappingStatus: "missing_mapping",
  });
  assert.equal(result.status, "token_expired");
});

test("never-synced mapped integration awaits live validation", () => {
  const result = evaluateIntegrationHealth({ ...base, lastSuccessfulSyncAt: null });
  assert.equal(result.status, "awaiting_live_validation");
  assert.equal(result.dataFreshness, "never");
});
