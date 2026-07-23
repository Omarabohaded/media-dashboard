import { beforeEach, describe, expect, it, vi } from "vitest";
import { allowed, body, denied, expectNoSecrets, request } from "./routeTestUtils";

const state = vi.hoisted(() => ({
  access: null as null | ReturnType<typeof allowed>,
  reportError: null as Error | null,
}));

vi.mock("@/lib/serverAccess", () => ({
  requireClientAccess: vi.fn(async () => state.access ?? allowed()),
  requireClientManagementAccess: vi.fn(async () => state.access ?? allowed()),
  requireAuthenticatedUser: vi.fn(async () => state.access ?? allowed()),
}));

const report = {
  clientId: "client-visible",
  clientName: "Visible Client",
  currency: { status: "single", codes: ["AED"], displayCode: "AED" },
  rows: [{ sourceType: "meta", spend: 100, purchases: 4, purchaseValue: 500 }],
  channels: [{ sourceType: "meta", included: true, spend: 100 }],
  issues: [],
  blended: { spend: 100, purchases: 4, purchaseValue: 500, roas: 5 },
};

vi.mock("@/lib/paidMediaReportingService", () => ({
  buildClientPaidMediaReport: vi.fn(async () => {
    if (state.reportError) throw state.reportError;
    return report;
  }),
}));
vi.mock("@/lib/clientStore", () => ({
  listClients: vi.fn(async () => [
    { id: "client-visible", name: "Visible Client", currencyCode: "AED" },
    { id: "client-two", name: "Second Client", currencyCode: "USD" },
  ]),
  getClientStoreHealth: vi.fn(async () => ({ durable: true, message: "Durable" })),
  getMetaConnection: vi.fn(async () => null),
}));
vi.mock("@/lib/portfolioReporting", () => ({
  summarizePortfolioPaidMedia: vi.fn((reports: unknown[]) => ({
    clients: reports,
    currencyGroups: [{ currencyCode: "AED", spend: 100 }],
    unavailableClients: [],
  })),
}));
vi.mock("@/lib/accessControl", () => ({
  getVisibleClientsForUser: vi.fn(async (_user, clients) => clients),
}));
vi.mock("@/lib/integrationHealth", () => ({
  evaluateIntegrationHealth: vi.fn((input) => ({
    clientId: input.clientId,
    clientName: input.clientName,
    sourceType: input.sourceType,
    status: "healthy",
    dataFreshness: "fresh",
  })),
}));
vi.mock("@/lib/tiktokConnectionStore", () => ({ getTikTokConnection: vi.fn(async () => null) }));
vi.mock("@/lib/googleAdsConnectionStore", () => ({ getGoogleAdsConnection: vi.fn(async () => null) }));
vi.mock("@/lib/snapConnectionStore", () => ({ getSnapConnection: vi.fn(async () => null) }));
vi.mock("@/lib/sourceConversionMappingStore", () => ({
  resolveSourceConversionMapping: vi.fn(async () => ({ status: "mapped" })),
}));
vi.mock("@/lib/prototypeSyncStore", () => ({
  readSyncStateStore: vi.fn(async () => ({ syncRuns: [] })),
}));

import { GET as clientReport } from "@/app/api/reports/client/route";
import { GET as paidMedia } from "@/app/api/dashboard/paid-media/route";
import { GET as portfolio } from "@/app/api/reports/portfolio/route";
import { GET as health } from "@/app/api/health/integrations/route";

describe("single-client and dashboard reporting routes", () => {
  beforeEach(() => {
    state.access = allowed();
    state.reportError = null;
  });

  for (const [name, handler] of [
    ["single-client", clientReport],
    ["paid-media dashboard", paidMedia],
  ] as const) {
    it(`${name} rejects unauthenticated requests`, async () => {
      state.access = denied(401) as never;
      expect((await handler(request("/?clientId=client-visible") as never)).status).toBe(401);
    });

    it(`${name} rejects fabricated/invalid sessions`, async () => {
      state.access = denied(401, "Invalid or expired session.") as never;
      const response = await handler(request("/?clientId=client-visible", {
        headers: { cookie: "authjs.session-token=fabricated" },
      }) as never);
      expect(response.status).toBe(401);
      expect(await body(response)).toEqual({ error: "Invalid or expired session." });
    });

    it(`${name} rejects an unauthorized client`, async () => {
      state.access = denied(403, "You do not have access to this client.") as never;
      expect((await handler(request("/?clientId=client-hidden") as never)).status).toBe(403);
    });

    it(`${name} returns the normalized visible-client report without secrets`, async () => {
      const response = await handler(request("/?clientId=client-visible&datePreset=last_30d") as never);
      expect(response.status).toBe(200);
      const payload = await body(response);
      expect(payload).toMatchObject({
        clientId: "client-visible",
        currency: { status: "single", displayCode: "AED" },
        blended: { roas: 5 },
      });
      expectNoSecrets(payload);
    });
  }

  it("paid-media reports provider failures with a stable error shape", async () => {
    state.reportError = new Error("Provider HTTP 503");
    const response = await paidMedia(request("/?clientId=client-visible") as never);
    expect(response.status).toBe(500);
    expect(await body(response)).toEqual({ error: "Provider HTTP 503" });
  });
});

describe("portfolio and integration-health routes", () => {
  beforeEach(() => {
    state.access = allowed();
    state.reportError = null;
  });

  it.each([
    ["portfolio", portfolio, "/"],
    ["health", health, "/"],
  ])("%s rejects unauthenticated access", async (_name, handler, path) => {
    state.access = denied(401) as never;
    expect((await handler(request(path) as never)).status).toBe(401);
  });

  it("portfolio rejects non-admin management access", async () => {
    state.access = denied(403, "Owner or admin access is required.") as never;
    expect((await portfolio(request("/") as never)).status).toBe(403);
  });

  it("portfolio returns per-currency evidence and no secrets", async () => {
    const response = await portfolio(request("/?since=2026-07-01&until=2026-07-23") as never);
    const payload = await body(response);
    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      currencyGroups: [{ currencyCode: "AED", spend: 100 }],
      implementationStatus: "implemented_awaiting_live_validation",
    });
    expectNoSecrets(payload);
  });

  it("health returns fleet summary and user-visible records", async () => {
    const response = await health();
    const payload = await body(response);
    expect(response.status).toBe(200);
    expect(payload.summary).toMatchObject({ total: 8, healthy: 8 });
    expect(Array.isArray(payload.records)).toBe(true);
    expectNoSecrets(payload);
  });
});
