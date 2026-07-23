import assert from "node:assert/strict";
import test from "node:test";

const originalFetch = globalThis.fetch;
const originalKvUrl = process.env.KV_REST_API_URL;
const originalKvToken = process.env.KV_REST_API_TOKEN;
const values = new Map();
process.env.KV_REST_API_URL = "https://workflow-kv.invalid";
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

const clients = await import("../src/lib/clientStore.ts");
const context = await import("../src/lib/clientContext.ts");
const tiktok = await import("../src/lib/tiktokConnectionStore.ts");
const mappings = await import("../src/lib/sourceConversionMappingStore.ts");
const { executePaidMediaSync } = await import("../src/lib/paidMediaSync.ts");
const { buildBlendedPaidMediaReport } = await import("../src/lib/paidMediaContract.ts");
const { mergePortfolioPaidMedia } = await import("../src/lib/portfolioMerge.ts");
const { evaluateIntegrationHealth } = await import("../src/lib/integrationHealth.ts");
const { deleteClientAndScopedData } = await import("../src/lib/clientLifecycle.ts");
const { readSyncStateStore } = await import("../src/lib/prototypeSyncStore.ts");

test.after(() => {
  globalThis.fetch = originalFetch;
  if (originalKvUrl === undefined) delete process.env.KV_REST_API_URL;
  else process.env.KV_REST_API_URL = originalKvUrl;
  if (originalKvToken === undefined) delete process.env.KV_REST_API_TOKEN;
  else process.env.KV_REST_API_TOKEN = originalKvToken;
});

test("mocked authenticated workflow reaches reports and cleans up completely", async () => {
  const client = await clients.createClient({
    name: "Workflow Client",
    websitePlatform: "shopify",
    currencyCode: "AED",
  });

  const local = new Map();
  const events = [];
  const originalWindow = globalThis.window;
  globalThis.window = {
    localStorage: { setItem: (key, value) => local.set(key, value) },
    dispatchEvent: (event) => events.push(event),
  };
  context.persistActiveClient(client.id);
  globalThis.window = originalWindow;
  assert.equal(local.get(context.ACTIVE_CLIENT_STORAGE_KEY), client.id);
  assert.equal(events.length, 1);

  const now = new Date().toISOString();
  await tiktok.upsertTikTokConnection({
    clientId: client.id,
    accessToken: "mock-access",
    refreshToken: "mock-refresh",
    connectedAt: now,
    selectedAdvertiserId: "advertiser-1",
    selectedAdvertiserName: "Mock advertiser",
    lastError: null,
    accessTokenExpiresAt: "2099-01-01T00:00:00.000Z",
  });
  await mappings.upsertSourceConversionMapping({
    sourceType: "tiktok",
    scope: "client",
    clientId: client.id,
    purchasesEvent: "complete_payment",
    purchaseValueEvent: "value_per_complete_payment",
    enabled: true,
  });

  const rows = await executePaidMediaSync({
    clientId: client.id,
    clientName: client.name,
    sourceType: "tiktok",
    request: async () => [
      {
        sourceType: "tiktok",
        channel: "tiktok",
        clientId: client.id,
        dateRange: { since: "2026-07-01", until: "2026-07-07" },
        spend: 100,
        impressions: 1000,
        clicks: 100,
        purchases: 5,
        purchaseValue: 500,
        ctr: 0.1,
        cpc: 1,
        cpm: 100,
        roas: 5,
        conversionMappingStatus: "mapped",
        purchasesEvent: "complete_payment",
        purchaseValueEvent: "value_per_complete_payment",
        sourceRecordId: "campaign-1",
        sourceRecordName: "Campaign",
        rawMetadata: {},
      },
    ],
  });
  const report = buildBlendedPaidMediaReport(rows, ["tiktok"]);
  assert.equal(report.blended.spend, 100);
  assert.equal(report.blended.purchaseValue, 500);

  const portfolio = mergePortfolioPaidMedia(
    [
      {
        clientId: client.id,
        currencyCode: "AED",
        storeConnected: true,
        metaConnected: false,
        adSpend: null,
        roas: null,
        metaSourceLabel: "",
        issues: [],
        status: "partial",
      },
    ],
    [
      {
        clientId: client.id,
        blended: report.blended,
        channels: report.channels,
        issues: [],
      },
    ]
  );
  assert.equal(portfolio.summary.readyStores, 1);

  const run = (await readSyncStateStore()).syncRuns[0];
  const health = evaluateIntegrationHealth({
    clientId: client.id,
    clientName: client.name,
    sourceType: "tiktok",
    connected: true,
    selectedAccountId: "advertiser-1",
    mappingStatus: "mapped",
    tokenExpiresAt: "2099-01-01T00:00:00.000Z",
    lastSuccessfulSyncAt: run.finishedAt,
    lastAttemptAt: run.finishedAt,
    lastError: null,
  });
  assert.equal(health.status, "healthy");

  await deleteClientAndScopedData(client.id);
  await assert.rejects(
    () => clients.getRequiredClientById(client.id),
    /not found/i
  );
  assert.equal(await tiktok.getTikTokConnection(client.id), null);
  assert.equal(
    (await mappings.listSourceConversionMappings()).some(
      (mapping) => mapping.clientId === client.id
    ),
    false
  );
  assert.equal(
    (await readSyncStateStore()).syncRuns.some(
      (item) => item.clientId === client.id
    ),
    false
  );
});
