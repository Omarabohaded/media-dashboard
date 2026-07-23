import assert from "node:assert/strict";
import test from "node:test";

const originalFetch = globalThis.fetch;
const originalKvUrl = process.env.KV_REST_API_URL;
const originalKvToken = process.env.KV_REST_API_TOKEN;
const values = new Map();

process.env.KV_REST_API_URL = "https://test-kv.invalid";
process.env.KV_REST_API_TOKEN = "test-token";
globalThis.fetch = async (_url, init) => {
  const [command, key, value] = JSON.parse(init.body);
  if (command === "GET") {
    return Response.json({ result: values.get(key) ?? null });
  }
  if (command === "SET") {
    values.set(key, value);
    return Response.json({ result: "OK" });
  }
  return Response.json({ error: "Unsupported command" }, { status: 400 });
};

const storage = await import("../src/lib/runtimeStorage.ts");
const clients = await import("../src/lib/clientStore.ts");
const lifecycle = await import("../src/lib/clientLifecycle.ts");
const sourceMappings = await import("../src/lib/sourceConversionMappingStore.ts");
const metricMappings = await import("../src/lib/metricMappingStore.ts");
const syncStore = await import("../src/lib/prototypeSyncStore.ts");
const accessStore = await import("../src/lib/accessStore.ts");
const tiktokStore = await import("../src/lib/tiktokConnectionStore.ts");
const googleStore = await import("../src/lib/googleAdsConnectionStore.ts");
const snapStore = await import("../src/lib/snapConnectionStore.ts");
const clientContext = await import("../src/lib/clientContext.ts");

test.after(() => {
  globalThis.fetch = originalFetch;
  if (originalKvUrl === undefined) delete process.env.KV_REST_API_URL;
  else process.env.KV_REST_API_URL = originalKvUrl;
  if (originalKvToken === undefined) delete process.env.KV_REST_API_TOKEN;
  else process.env.KV_REST_API_TOKEN = originalKvToken;
});

test("client CRUD persists through the runtime storage abstraction", async () => {
  const created = await clients.createClient({
    name: "Lifecycle Client",
    websitePlatform: "shopify",
    currencyCode: "AED",
    notes: "created",
  });
  assert.equal((await clients.listClients())[0].id, created.id);

  const updated = await clients.updateClient({
    clientId: created.id,
    name: "Lifecycle Client Updated",
    websitePlatform: "woocommerce",
    currencyCode: "USD",
    notes: "updated",
  });
  assert.equal(updated.name, "Lifecycle Client Updated");
  assert.equal((await clients.getRequiredClientById(created.id)).currencyCode, "USD");
});

test("active-client selection persists and propagates immediately", () => {
  const events = [];
  const local = new Map();
  const originalWindow = globalThis.window;
  globalThis.window = {
    localStorage: {
      setItem: (key, value) => local.set(key, value),
    },
    dispatchEvent: (event) => events.push(event),
  };

  clientContext.persistActiveClient("client-active");
  assert.equal(local.get(clientContext.ACTIVE_CLIENT_STORAGE_KEY), "client-active");
  assert.equal(events[0].type, clientContext.ACTIVE_CLIENT_CHANGE_EVENT);
  assert.equal(events[0].detail.clientId, "client-active");
  globalThis.window = originalWindow;
});

test("deleting a client removes all scoped data and preserves global defaults", async () => {
  const target = (await clients.listClients()).find(
    (client) => client.name === "Lifecycle Client Updated"
  );
  assert.ok(target);
  const clientId = target.id;
  const now = new Date().toISOString();

  await sourceMappings.saveSourceConversionMappings([
    {
      sourceType: "meta",
      scope: "global",
      clientId: null,
      purchasesEvent: "purchase",
      purchaseValueEvent: "value",
      enabled: true,
      updatedAt: now,
    },
    {
      sourceType: "tiktok",
      scope: "client",
      clientId,
      purchasesEvent: "complete_payment",
      purchaseValueEvent: "value",
      enabled: true,
      updatedAt: now,
    },
  ]);
  await metricMappings.upsertMetricMapping({
    metricId: "roas",
    scope: "client",
    clientId,
    revenueBasis: "platform_attributed_revenue",
    denominatorChoice: "platform_spend",
    includedChannels: ["meta"],
    benchmarkDirection: null,
    benchmarkGood: null,
    benchmarkWatch: null,
    benchmarkRisk: null,
    adminNotes: null,
  });
  await tiktokStore.upsertTikTokConnection({
    clientId,
    accessToken: "token",
    refreshToken: "refresh",
    connectedAt: now,
    selectedAdvertiserId: "adv",
    selectedAdvertiserName: "Advertiser",
    lastError: null,
  });
  await googleStore.upsertGoogleAdsConnection({
    clientId,
    accessToken: "token",
    refreshToken: "refresh",
    connectedAt: now,
    accessTokenExpiresAt: now,
    selectedCustomerId: "customer",
    selectedCustomerName: "Customer",
    loginCustomerId: null,
    lastDiscoveryAt: null,
    lastDiscoveryError: null,
    lastError: null,
  });
  await snapStore.upsertSnapConnection({
    clientId,
    accessToken: "token",
    refreshToken: "refresh",
    connectedAt: now,
    accessTokenExpiresAt: now,
    selectedAdAccountId: "account",
    selectedAdAccountName: "Account",
    organizationId: "org",
    lastDiscoveryAt: null,
    lastDiscoveryError: null,
    lastError: null,
  });
  await syncStore.updateSyncStateStore((state) => ({
    ...state,
    connections: [
      {
        clientId,
        clientName: target.name,
        platform: "tiktok",
        accountLabel: "Advertiser",
        accountId: "adv",
        health: "connected",
        scopes: [],
        lastError: null,
        connectedAt: now,
        lastSyncedAt: null,
        sourceMode: "mock",
        recommendedNextStep: "",
      },
    ],
  }));
  await storage.writeRuntimeJsonStore(
    "media-dashboard:access-state",
    "access-state.json",
    {
      version: 1,
      updatedAt: now,
      users: await accessStore.listUsers(),
      assignments: [
        {
          id: "assignment-test",
          userId: (await accessStore.listUsers())[0].id,
          clientId,
          accessLevel: "manage",
          createdAt: now,
          updatedAt: now,
        },
      ],
    }
  );

  const result = await lifecycle.deleteClientAndScopedData(clientId);
  assert.deepEqual(result.completed, [
    "source-conversion-mappings",
    "metric-mappings",
    "platform-connections",
    "sync-state",
    "access-assignments",
    "client-record",
  ]);
  await assert.rejects(() => clients.getRequiredClientById(clientId), /not found/i);
  assert.equal(
    (await sourceMappings.listSourceConversionMappings()).some(
      (mapping) => mapping.scope === "global"
    ),
    true
  );
  assert.equal(
    (await sourceMappings.listSourceConversionMappings()).some(
      (mapping) => mapping.clientId === clientId
    ),
    false
  );
  assert.equal(
    (await metricMappings.listMetricMappings()).some(
      (mapping) => mapping.clientId === clientId
    ),
    false
  );
  assert.equal(await tiktokStore.getTikTokConnection(clientId), null);
  assert.equal(await googleStore.getGoogleAdsConnection(clientId), null);
  assert.equal(await snapStore.getSnapConnection(clientId), null);
  assert.equal(
    (await syncStore.readSyncStateStore()).connections.some(
      (connection) => connection.clientId === clientId
    ),
    false
  );
  assert.equal(
    (await accessStore.listAssignments()).some(
      (assignment) => assignment.clientId === clientId
    ),
    false
  );
});
