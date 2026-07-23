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

test("health states cover connection, account, mapping, failure, stale, and healthy", () => {
  const base = {
    clientId: "client-1",
    clientName: "Client",
    sourceType: "google",
    connected: true,
    selectedAccountId: "account-1",
    mappingStatus: "mapped",
    tokenExpiresAt: "2026-07-25T00:00:00.000Z",
    lastSuccessfulSyncAt: "2026-07-23T11:00:00.000Z",
    lastAttemptAt: "2026-07-23T11:00:00.000Z",
    lastError: null,
    now: "2026-07-23T12:00:00.000Z",
  };
  assert.equal(evaluateIntegrationHealth({ ...base, connected: false }).status, "needs_connection");
  assert.equal(evaluateIntegrationHealth({ ...base, selectedAccountId: null }).status, "needs_account");
  assert.equal(evaluateIntegrationHealth({ ...base, mappingStatus: "missing_mapping" }).status, "missing_mapping");
  assert.equal(evaluateIntegrationHealth({ ...base, lastError: "failed" }).status, "failed");
  assert.equal(
    evaluateIntegrationHealth({
      ...base,
      lastSuccessfulSyncAt: "2026-07-20T00:00:00.000Z",
    }).status,
    "stale"
  );
  assert.equal(evaluateIntegrationHealth(base).status, "healthy");
});
