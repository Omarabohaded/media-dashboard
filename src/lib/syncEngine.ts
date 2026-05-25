import {
  fetchMetaAdAccounts,
  fetchMetaInsightsPreview,
  getMetaConfig,
} from "./integrations/meta";
import {
  exchangeShopifyClientCredentials,
  fetchShopifyStoreTruthPreview,
  getShopifyConfig,
} from "./integrations/shopify";
import {
  appendBusinessTruthSnapshot,
  appendMediaSnapshot,
  appendSyncRun,
  readSyncStateStore,
  upsertConnectionRecord,
} from "./prototypeSyncStore";
import {
  BusinessTruthSnapshot,
  IntegrationConnectionRecord,
  MediaPlatformSnapshot,
  SyncRunRecord,
} from "./syncContracts";

function buildRun(platform: SyncRunRecord["platform"]): SyncRunRecord {
  return {
    id: crypto.randomUUID(),
    platform,
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    recordsProcessed: 0,
    storageMode: "ephemeral_tmp",
    error: null,
    notes: [],
  };
}

function finalizeRun(
  run: SyncRunRecord,
  updates: Partial<SyncRunRecord>
): SyncRunRecord {
  return {
    ...run,
    ...updates,
    finishedAt: new Date().toISOString(),
  };
}

export async function runMetaSync(input: {
  accessToken: string | null;
  accountId: string | null;
}) {
  const run = buildRun("meta");
  const config = getMetaConfig();

  if (config.missingEnv.length > 0) {
    const failed = finalizeRun(run, {
      status: "failed",
      error: `Missing Meta config: ${config.missingEnv.join(", ")}`,
      notes: ["Add Meta app credentials in Vercel before syncing."],
    });
    await appendSyncRun(failed);
    return failed;
  }

  if (!input.accessToken) {
    const failed = finalizeRun(run, {
      status: "failed",
      error: "Meta is not connected yet.",
      notes: ["Connect Meta through the official app flow first."],
    });
    await appendSyncRun(failed);
    return failed;
  }

  if (!input.accountId) {
    const failed = finalizeRun(run, {
      status: "failed",
      error: "No Meta ad account is selected.",
      notes: ["Choose a test ad account before running sync."],
    });
    await appendSyncRun(failed);
    return failed;
  }

  try {
    const accounts = await fetchMetaAdAccounts(input.accessToken);
    const account =
      accounts.find((item) => item.id === input.accountId) ?? null;
    const rows = await fetchMetaInsightsPreview(input.accessToken, input.accountId);

    const snapshot: MediaPlatformSnapshot = {
      platform: "meta",
      capturedAt: new Date().toISOString(),
      accountId: input.accountId,
      accountLabel: account?.name ?? input.accountId,
      spend: rows.reduce((sum, row) => sum + row.spend, 0),
      impressions: rows.reduce((sum, row) => sum + row.impressions, 0),
      clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
      purchases: rows.reduce((sum, row) => sum + row.purchases, 0),
      purchaseValue: rows.reduce((sum, row) => sum + row.purchaseValue, 0),
      campaigns: rows.length,
    };

    const connection: IntegrationConnectionRecord = {
      platform: "meta",
      accountLabel: snapshot.accountLabel,
      accountId: input.accountId,
      health: "sync_ready",
      scopes: config.scopes,
      lastError: null,
      connectedAt: run.startedAt,
      lastSyncedAt: snapshot.capturedAt,
      sourceMode: "ephemeral",
      recommendedNextStep:
        "Compare this Meta snapshot against Shopify or GA4 before trusting scale recommendations.",
    };

    await appendMediaSnapshot(snapshot);
    await upsertConnectionRecord(connection);

    const succeeded = finalizeRun(run, {
      status: "succeeded",
      recordsProcessed: rows.length,
      notes: [
        `${rows.length} campaign rows captured.`,
        "This is stored in ephemeral prototype storage until a database is added.",
      ],
    });
    await appendSyncRun(succeeded);
    return succeeded;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Meta sync failed.";
    const failed = finalizeRun(run, {
      status: "failed",
      error: message,
      notes: ["Check Meta app permissions, account access, and token validity."],
    });
    await appendSyncRun(failed);
    return failed;
  }
}

export async function runShopifySync(input: { accessToken: string | null }) {
  const run = buildRun("shopify");
  const config = getShopifyConfig();

  if (config.missingEnv.length > 0) {
    const failed = finalizeRun(run, {
      status: "failed",
      error: `Missing Shopify config: ${config.missingEnv.join(", ")}`,
      notes: ["Add Shopify store credentials in Vercel before syncing."],
    });
    await appendSyncRun(failed);
    return failed;
  }

  try {
    let accessToken = input.accessToken;

    if (!accessToken) {
      const token = await exchangeShopifyClientCredentials();
      accessToken = token.access_token ?? null;
    }

    if (!accessToken) {
      throw new Error("Shopify access token was not available.");
    }

    const preview = await fetchShopifyStoreTruthPreview(accessToken);
    const snapshot: BusinessTruthSnapshot = {
      source: "shopify",
      capturedAt: new Date().toISOString(),
      grossSales: preview.snapshot.grossSales,
      taxTotal: preview.snapshot.taxTotal,
      shippingTotal: preview.snapshot.shippingTotal,
      netSales: preview.snapshot.netSales,
      orders: preview.snapshot.ordersCount,
      averageOrderValue: preview.snapshot.averageOrderValue,
    };

    const connection: IntegrationConnectionRecord = {
      platform: "shopify",
      accountLabel: preview.snapshot.shopName,
      accountId: null,
      health: "sync_ready",
      scopes: config.requestedScopes,
      lastError: null,
      connectedAt: run.startedAt,
      lastSyncedAt: snapshot.capturedAt,
      sourceMode: "ephemeral",
      recommendedNextStep:
        "Pair this business truth with Meta before enabling real decision scoring.",
    };

    await appendBusinessTruthSnapshot(snapshot);
    await upsertConnectionRecord(connection);

    const succeeded = finalizeRun(run, {
      status: "succeeded",
      recordsProcessed: preview.orders.length,
      notes: [
        `${preview.orders.length} Shopify orders captured for the last 7 days.`,
        "Sessions and funnel-stage metrics still need GA4 or storefront analytics.",
      ],
    });
    await appendSyncRun(succeeded);
    return succeeded;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Shopify sync failed.";
    const failed = finalizeRun(run, {
      status: "failed",
      error: message,
      notes: ["Check the Shopify app install, scopes, and credentials."],
    });
    await appendSyncRun(failed);
    return failed;
  }
}

export async function readSyncDashboardState() {
  return readSyncStateStore();
}
