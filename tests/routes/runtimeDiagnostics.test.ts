import { beforeEach, describe, expect, it, vi } from "vitest";
import { allowed, body, denied, expectNoSecrets, request } from "./routeTestUtils";

const state = vi.hoisted(() => ({
  access: null as unknown,
  syncStatus: "succeeded",
}));

vi.mock("@/lib/serverAccess", () => ({
  requireAuthenticatedUser: vi.fn(async () => state.access ?? allowed()),
  requireClientIntegrationAccess: vi.fn(async () => state.access ?? allowed()),
  requireClientAccess: vi.fn(async () => state.access ?? allowed()),
}));
vi.mock("@/lib/prototypeSyncStore", () => ({
  getSyncStorageMeta: vi.fn(async () => ({ durable: true, location: "test-kv" })),
}));
vi.mock("@/lib/syncEngine", () => ({
  readSyncDashboardState: vi.fn(async () => ({ syncRuns: [{ id: "run-1", status: "succeeded" }] })),
  runMetaSync: vi.fn(async () => ({ id: "run-meta", status: state.syncStatus })),
  runShopifySync: vi.fn(async () => ({ id: "run-shopify", status: state.syncStatus })),
  runWordPressSync: vi.fn(async () => ({ id: "run-wordpress", status: state.syncStatus })),
}));
vi.mock("@/lib/clientStore", () => ({
  getClientById: vi.fn(async () => ({ id: "client-visible", name: "Visible Client" })),
  getMetaConnection: vi.fn(async () => ({
    accessToken: "access-token-secret",
    selectedAccountId: "act-1",
  })),
}));
vi.mock("@/lib/metricOverrideStore", () => ({ listMetricOverrides: vi.fn(async () => []) }));
vi.mock("@/lib/metricMappingStore", () => ({ listMetricMappings: vi.fn(async () => []) }));
vi.mock("@/lib/dashboardMetricLogic", () => ({
  buildDashboardMetricLogic: vi.fn(() => ({ roas: { status: "healthy" } })),
  DEFAULT_DASHBOARD_METRIC_LOGIC: { status: "default" },
}));

import { GET as syncState } from "@/app/api/sync/state/route";
import { POST as syncRun } from "@/app/api/sync/run/route";
import { GET as metricLogic } from "@/app/api/dashboard/metric-logic/route";

describe("runtime diagnostics and sync routes", () => {
  beforeEach(() => {
    state.access = allowed();
    state.syncStatus = "succeeded";
  });

  it.each([
    ["sync state", () => syncState()],
    ["sync execution", () => syncRun(request("/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ platform: "meta", clientId: "client-visible" }) }) as never)],
    ["metric logic", () => metricLogic(request("/?clientId=client-visible") as never)],
  ])("%s rejects unauthenticated requests", async (_name, execute) => {
    state.access = denied(401);
    expect((await execute()).status).toBe(401);
  });

  it("returns durable runtime sync diagnostics without connection secrets", async () => {
    const response = await syncState();
    const payload = await body(response);
    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      storage: { durable: true, location: "test-kv" },
      note: expect.stringContaining("durable runtime storage"),
    });
    expectNoSecrets(payload);
  });

  it("rejects malformed sync payload and unauthorized clients", async () => {
    const malformed = await syncRun(request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ platform: "unknown", clientId: "client-visible" }),
    }) as never);
    expect(malformed.status).toBe(400);
    state.access = denied(403);
    const unauthorized = await syncRun(request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ platform: "meta", clientId: "client-hidden" }),
    }) as never);
    expect(unauthorized.status).toBe(403);
  });

  it("maps successful and failed sync outcomes to correct status codes", async () => {
    const req = () => request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ platform: "meta", clientId: "client-visible" }),
    });
    expect((await syncRun(req() as never)).status).toBe(200);
    state.syncStatus = "failed";
    expect((await syncRun(req() as never)).status).toBe(400);
  });

  it("returns client-scoped metric logic", async () => {
    const response = await metricLogic(request("/?clientId=client-visible") as never);
    expect(response.status).toBe(200);
    expect(await body(response)).toEqual({ metricLogic: { roas: { status: "healthy" } } });
  });
});
