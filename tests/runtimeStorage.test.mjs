import assert from "node:assert/strict";
import test from "node:test";

const originalKvUrl = process.env.KV_REST_API_URL;
const originalKvToken = process.env.KV_REST_API_TOKEN;
const originalUpstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const originalUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const storage = await import("../src/lib/runtimeStorage.ts");

test.after(() => {
  if (originalKvUrl) process.env.KV_REST_API_URL = originalKvUrl;
  if (originalKvToken) process.env.KV_REST_API_TOKEN = originalKvToken;
  if (originalUpstashUrl) process.env.UPSTASH_REDIS_REST_URL = originalUpstashUrl;
  if (originalUpstashToken) process.env.UPSTASH_REDIS_REST_TOKEN = originalUpstashToken;
});

test("ephemeral runtime storage round-trips persisted JSON", async () => {
  const suffix = `${process.pid}-${Date.now()}`;
  const key = `test:client-state:${suffix}`;
  const fileName = `client-state-${suffix}.json`;
  const expected = { version: 1, clients: [{ id: "client-test" }] };

  await storage.writeRuntimeJsonStore(key, fileName, expected);
  const actual = await storage.readRuntimeJsonStore(key, fileName, null);

  assert.deepEqual(actual, expected);
});

test("storage health explicitly reports an ephemeral deployment risk", async () => {
  const health = await storage.checkRuntimeJsonStoreHealth(
    "test:client-state:health",
    `client-state-health-${process.pid}.json`
  );

  assert.equal(health.storageMode, "ephemeral_tmp");
  assert.equal(health.durable, false);
  assert.equal(health.status, "degraded");
  assert.match(health.message, /reset between deployments/);
  assert.ok(Date.parse(health.checkedAt));
});
