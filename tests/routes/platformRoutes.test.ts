import { beforeEach, describe, expect, it, vi } from "vitest";
import { allowed, body, denied, expectNoSecrets, request, visibleClient } from "./routeTestUtils";

const state = vi.hoisted(() => ({
  access: null as unknown,
  providerFailure: false,
  connections: {
    tiktok: null as null | Record<string, unknown>,
    google: null as null | Record<string, unknown>,
    snap: null as null | Record<string, unknown>,
  },
}));

vi.mock("@/lib/serverAccess", () => ({
  requireClientAccess: vi.fn(async () => state.access ?? allowed()),
  requireClientIntegrationAccess: vi.fn(async () => state.access ?? allowed()),
}));
vi.mock("@/lib/clientStore", () => ({
  getRequiredClientById: vi.fn(async () => visibleClient),
}));
vi.mock("@/lib/providerAccess", () => ({
  withTikTokAccess: vi.fn(async (_id, operation) => operation("access-token-secret")),
  withGoogleAdsAccess: vi.fn(async (_id, operation) => operation("access-token-secret")),
  withSnapAccess: vi.fn(async (_id, operation) => operation("access-token-secret")),
}));
vi.mock("@/lib/paidMediaSync", () => ({
  executePaidMediaSync: vi.fn(async ({ request: execute }) => execute()),
}));
vi.mock("@/lib/sourceConversionMappingStore", () => ({
  resolveSourceConversionMapping: vi.fn(async () => ({
    status: "mapped",
    purchasesEvent: "purchase",
    purchaseValueEvent: "purchase_value",
  })),
}));

vi.mock("@/lib/tiktokConnectionStore", () => ({
  getTikTokConnection: vi.fn(async () => state.connections.tiktok),
  upsertTikTokConnection: vi.fn(async (value) => value),
  clearTikTokConnection: vi.fn(async () => undefined),
  recordTikTokEventDiscovery: vi.fn(async () => undefined),
}));
vi.mock("@/lib/googleAdsConnectionStore", () => ({
  getGoogleAdsConnection: vi.fn(async () => state.connections.google),
  upsertGoogleAdsConnection: vi.fn(async (value) => value),
  clearGoogleAdsConnection: vi.fn(async () => undefined),
}));
vi.mock("@/lib/snapConnectionStore", () => ({
  getSnapConnection: vi.fn(async () => state.connections.snap),
  upsertSnapConnection: vi.fn(async (value) => value),
  clearSnapConnection: vi.fn(async () => undefined),
}));

vi.mock("@/lib/integrations/tiktok", () => ({
  fetchTikTokAdvertisers: vi.fn(async () => {
    if (state.providerFailure) throw new Error("TikTok HTTP 503");
    return [{ advertiserId: "tt-1", advertiserName: "TikTok Account" }];
  }),
  fetchTikTokRawConversionEvents: vi.fn(async () => {
    if (state.providerFailure) throw new Error("TikTok HTTP 503");
    return { events: [{ eventName: "purchase" }], rawRows: [{}] };
  }),
  toDiscoveredTikTokConversionEvents: vi.fn(() => [{
    eventName: "purchase",
    label: "Purchase",
    roles: ["purchases"],
  }]),
  fetchTikTokPaidMediaRows: vi.fn(async () => {
    if (state.providerFailure) throw new Error("TikTok HTTP 503");
    return [{ sourceType: "tiktok", spend: 10, purchases: 2, purchaseValue: 40 }];
  }),
  getTikTokConfig: vi.fn(() => ({ missingEnv: [], configured: true })),
  buildTikTokRedirectUri: vi.fn(() => "https://dashboard.test/api/callback"),
  TIKTOK_CLIENT_KEY_ENV: "TIKTOK_CLIENT_KEY",
  TIKTOK_CLIENT_SECRET_ENV: "TIKTOK_CLIENT_SECRET",
}));
vi.mock("@/lib/integrations/googleAds", () => ({
  fetchGoogleAdsCustomers: vi.fn(async () => {
    if (state.providerFailure) throw new Error("Google HTTP 503");
    return [{ customerId: "g-1", customerName: "Google Account", currencyCode: "AED" }];
  }),
  fetchGoogleAdsConversionEvents: vi.fn(async () => {
    if (state.providerFailure) throw new Error("Google HTTP 503");
    return [{ eventName: "customers/g-1/conversionActions/1", label: "Purchase", roles: ["purchases"] }];
  }),
  fetchGoogleAdsPaidMediaRows: vi.fn(async () => {
    if (state.providerFailure) throw new Error("Google HTTP 503");
    return [{ sourceType: "google", spend: 20, purchases: 3, purchaseValue: 80 }];
  }),
  getGoogleAdsConfig: vi.fn(() => ({ missingEnv: [] })),
  buildGoogleAdsRedirectUri: vi.fn(() => "https://dashboard.test/api/callback"),
}));
vi.mock("@/lib/integrations/snap", () => ({
  fetchSnapAdAccounts: vi.fn(async () => {
    if (state.providerFailure) throw new Error("Snap HTTP 503");
    return [{ adAccountId: "s-1", adAccountName: "Snap Account", organizationId: "org-1" }];
  }),
  fetchSnapPaidMediaRows: vi.fn(async () => {
    if (state.providerFailure) throw new Error("Snap HTTP 503");
    return [{ sourceType: "snap", spend: 30, purchases: 4, purchaseValue: 120 }];
  }),
  getSupportedSnapMetricCatalog: vi.fn(() => [
    { eventName: "purchases", label: "Purchases", roles: ["purchases"] },
    { eventName: "purchase_value", label: "Purchase value", roles: ["purchaseValue"] },
  ]),
  getSnapConfig: vi.fn(() => ({ missingEnv: [] })),
}));

import * as tiktokAccounts from "@/app/api/integrations/tiktok/accounts/route";
import * as tiktokEvents from "@/app/api/integrations/tiktok/events-preview/route";
import * as tiktokReport from "@/app/api/integrations/tiktok/report-preview/route";
import * as tiktokStatus from "@/app/api/integrations/tiktok/status/route";
import * as googleAccounts from "@/app/api/integrations/google/accounts/route";
import * as googleEvents from "@/app/api/integrations/google/events-preview/route";
import * as googleReport from "@/app/api/integrations/google/report-preview/route";
import * as googleStatus from "@/app/api/integrations/google/status/route";
import * as snapAccounts from "@/app/api/integrations/snap/accounts/route";
import * as snapEvents from "@/app/api/integrations/snap/events-preview/route";
import * as snapReport from "@/app/api/integrations/snap/report-preview/route";
import * as snapStatus from "@/app/api/integrations/snap/status/route";

const suites = [
  {
    source: "tiktok",
    accountId: "tt-1",
    connection: {
      accessToken: "access-token-secret",
      refreshToken: "refresh-token-secret",
      selectedAdvertiserId: "tt-1",
      selectedAdvertiserName: "TikTok Account",
      accessTokenExpiresAt: "2099-01-01T00:00:00.000Z",
    },
    accounts: tiktokAccounts,
    events: tiktokEvents,
    report: tiktokReport,
    status: tiktokStatus,
    selectionBody: { advertiserId: "tt-1" },
  },
  {
    source: "google",
    accountId: "g-1",
    connection: {
      accessToken: "access-token-secret",
      refreshToken: "refresh-token-secret",
      selectedCustomerId: "g-1",
      selectedCustomerName: "Google Account",
      accessTokenExpiresAt: "2099-01-01T00:00:00.000Z",
    },
    accounts: googleAccounts,
    events: googleEvents,
    report: googleReport,
    status: googleStatus,
    selectionBody: { customerId: "g-1" },
  },
  {
    source: "snap",
    accountId: "s-1",
    connection: {
      accessToken: "access-token-secret",
      refreshToken: "refresh-token-secret",
      selectedAdAccountId: "s-1",
      selectedAdAccountName: "Snap Account",
      accessTokenExpiresAt: "2099-01-01T00:00:00.000Z",
    },
    accounts: snapAccounts,
    events: snapEvents,
    report: snapReport,
    status: snapStatus,
    selectionBody: { adAccountId: "s-1" },
  },
] as const;

for (const suite of suites) {
  describe(`${suite.source} request/response routes`, () => {
    beforeEach(() => {
      state.access = allowed();
      state.providerFailure = false;
      state.connections[suite.source] = { clientId: visibleClient.id, ...suite.connection };
    });

    it.each([
      ["accounts", suite.accounts.GET],
      ["events-preview", suite.events.GET],
      ["report-preview", suite.report.GET],
      ["status", suite.status.GET],
    ])("rejects unauthenticated %s requests", async (_name, handler) => {
      state.access = denied(401);
      expect((await handler(request(`/?clientId=${visibleClient.id}`) as never)).status).toBe(401);
    });

    it("rejects fabricated sessions before reading connection state", async () => {
      state.access = denied(401, "Invalid or expired session.");
      const response = await suite.accounts.GET(request(`/?clientId=${visibleClient.id}`, {
        headers: { cookie: "authjs.session-token=fabricated" },
      }) as never);
      expect(response.status).toBe(401);
    });

    it("rejects an unauthorized client", async () => {
      state.access = denied(403, "You do not have access to this client.");
      expect((await suite.report.GET(request("/?clientId=client-hidden") as never)).status).toBe(403);
    });

    it("reports a missing connection/account clearly", async () => {
      state.connections[suite.source] = null;
      const accountsResponse = await suite.accounts.GET(request(`/?clientId=${visibleClient.id}`) as never);
      expect([400, 401]).toContain(accountsResponse.status);
      expect((await body(accountsResponse)).error).toBeTypeOf("string");
    });

    it("lists selectable accounts and does not leak stored tokens", async () => {
      const response = await suite.accounts.GET(request(`/?clientId=${visibleClient.id}`) as never);
      const payload = await body(response);
      expect(response.status).toBe(200);
      expect(Array.isArray(payload.accounts)).toBe(true);
      expectNoSecrets(payload);
    });

    if (suite.source !== "tiktok") {
      it("returns a stable JSON error when account discovery fails upstream", async () => {
        state.providerFailure = true;
        const response = await suite.accounts.GET(request(`/?clientId=${visibleClient.id}`) as never);
        expect(response.status).toBe(500);
        expect((await body(response)).error).toContain("HTTP 503");
      });
    }

    it("rejects a malformed/unknown account selection", async () => {
      const response = await suite.accounts.POST(request(`/?clientId=${visibleClient.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }) as never);
      expect([400, 404]).toContain(response.status);
      expect((await body(response)).error).toBeTypeOf("string");
    });

    it("saves a visible account selection", async () => {
      const response = await suite.accounts.POST(request(`/?clientId=${visibleClient.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(suite.selectionBody),
      }) as never);
      expect(response.status).toBe(200);
      expect(await body(response)).toMatchObject({ ok: true });
    });

    it("returns conversion discovery/catalog with explicit mapping evidence", async () => {
      const response = await suite.events.GET(request(`/?clientId=${visibleClient.id}`) as never);
      const payload = await body(response);
      expect(response.status).toBe(200);
      expect(Array.isArray(payload.events)).toBe(true);
      if (suite.source === "snap") expect(payload.upstreamDiscovery).toBe(false);
      expectNoSecrets(payload);
    });

    it("returns normalized report-preview rows without secrets", async () => {
      const response = await suite.report.GET(request(`/?clientId=${visibleClient.id}`) as never);
      const payload = await body(response);
      expect(response.status).toBe(200);
      expect(Array.isArray(payload.rows)).toBe(true);
      expect(payload.implementationStatus).toBe("implemented_awaiting_live_validation");
      expectNoSecrets(payload);
    });

    it("surfaces provider HTTP failures with status 500", async () => {
      state.providerFailure = true;
      const response = await suite.report.GET(request(`/?clientId=${visibleClient.id}`) as never);
      expect(response.status).toBe(500);
      expect((await body(response)).error).toContain("HTTP 503");
    });

    it("returns connected status, token expiry metadata, mapping state, and no secrets", async () => {
      const response = await suite.status.GET(request(`/?clientId=${visibleClient.id}`) as never);
      const payload = await body(response);
      expect(response.status).toBe(200);
      expect(payload).toMatchObject({ connected: true, tokenExpired: false });
      expectNoSecrets(payload);
    });

    it("allows an authorized disconnect", async () => {
      expect((await suite.status.DELETE(request(`/?clientId=${visibleClient.id}`) as never)).status).toBe(200);
    });
  });
}
