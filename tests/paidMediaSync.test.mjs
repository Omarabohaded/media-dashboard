import assert from "node:assert/strict";
import test from "node:test";

const originalFetch = globalThis.fetch;
const originalKvUrl = process.env.KV_REST_API_URL;
const originalKvToken = process.env.KV_REST_API_TOKEN;
const values = new Map();
process.env.KV_REST_API_URL = "https://sync-test.invalid";
process.env.KV_REST_API_TOKEN = "test-token";
globalThis.fetch = async (_url, init) => {
  const [command, key, value] = JSON.parse(init.body);
  if (command === "GET") return Response.json({ result: values.get(key) ?? null });
  if (command === "SET") {
    values.set(key, value);
    return Response.json({ result: "OK" });
  }
  return Response.json({ error: "Unsupported" }, { status: 400 });
};

const { executePaidMediaSync } = await import("../src/lib/paidMediaSync.ts");
const { readSyncStateStore } = await import("../src/lib/prototypeSyncStore.ts");

test.after(() => {
  globalThis.fetch = originalFetch;
  if (originalKvUrl === undefined) delete process.env.KV_REST_API_URL;
  else process.env.KV_REST_API_URL = originalKvUrl;
  if (originalKvToken === undefined) delete process.env.KV_REST_API_TOKEN;
  else process.env.KV_REST_API_TOKEN = originalKvToken;
});

for (const sourceType of ["tiktok", "google", "snap"]) {
  test(`${sourceType} reporting records attempt and success`, async () => {
    const rows = await executePaidMediaSync({
      clientId: "client-health",
      clientName: "Health Client",
      sourceType,
      request: async () => [{ sourceType, clientId: "client-health" }],
    });
    assert.equal(rows.length, 1);
    const run = (await readSyncStateStore()).syncRuns.find(
      (item) => item.platform === sourceType
    );
    assert.equal(run.status, "succeeded");
    assert.ok(run.startedAt);
    assert.ok(run.finishedAt);
    assert.equal(run.recordsProcessed, 1);
    assert.equal(run.error, null);
  });
}

test("paid-platform failure persists the reason and does not retry implicitly", async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      executePaidMediaSync({
        clientId: "client-health",
        clientName: "Health Client",
        sourceType: "tiktok",
        request: async () => {
          calls += 1;
          throw new Error("mock provider failure");
        },
      }),
    /mock provider failure/
  );
  assert.equal(calls, 1);
  const run = (await readSyncStateStore()).syncRuns[0];
  assert.equal(run.status, "failed");
  assert.match(run.error, /mock provider failure/);
  assert.ok(run.startedAt);
  assert.ok(run.finishedAt);
});
