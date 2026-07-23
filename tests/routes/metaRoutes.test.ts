import { beforeEach, describe, expect, it, vi } from "vitest";
import { allowed, body, denied, expectNoSecrets, request, visibleClient } from "./routeTestUtils";

const state = vi.hoisted(() => ({
  access: null as unknown,
  providerFailure: false,
  connection: null as null | Record<string, unknown>,
}));

vi.mock("@/lib/serverAccess", () => ({
  requireClientAccess: vi.fn(async () => state.access ?? allowed()),
  requireClientIntegrationAccess: vi.fn(async () => state.access ?? allowed()),
}));
vi.mock("@/lib/clientStore", () => ({
  getClientById: vi.fn(async () => visibleClient),
  getRequiredClientById: vi.fn(async () => visibleClient),
  getMetaConnection: vi.fn(async () => state.connection),
  upsertMetaConnection: vi.fn(async (value) => value),
  clearMetaConnection: vi.fn(async () => undefined),
}));
vi.mock("@/lib/sourceConversionMappingStore", () => ({
  resolveSourceConversionMapping: vi.fn(async () => ({ status: "mapped" })),
}));
vi.mock("@/lib/integrations/meta", () => ({
  fetchMetaAdAccounts: vi.fn(async () => {
    if (state.providerFailure) throw new Error("Meta HTTP 503");
    return [{ id: "act_1", name: "Meta Account", currency: "AED" }];
  }),
  fetchMetaInsightsPreviewForRange: vi.fn(async () => {
    if (state.providerFailure) throw new Error("Meta HTTP 503");
    return [{ campaignId: "m-1", spend: 10 }];
  }),
  getMetaConfig: vi.fn(() => ({ missingEnv: [] })),
  buildMetaRedirectUri: vi.fn(() => "https://dashboard.test/api/callback"),
}));

import * as account from "@/app/api/integrations/meta/account/route";
import * as insights from "@/app/api/integrations/meta/insights-preview/route";
import * as status from "@/app/api/integrations/meta/status/route";

describe("Meta account/status/reporting routes", () => {
  beforeEach(() => {
    state.access = allowed();
    state.providerFailure = false;
    state.connection = {
      accessToken: "access-token-secret",
      selectedAccountId: "act_1",
      selectedAccountName: "Meta Account",
      lastError: null,
    };
  });

  it.each([
    ["status", status.GET, request("/?clientId=client-visible")],
    ["insights", insights.GET, request("/?clientId=client-visible")],
    ["account selection", account.POST, request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: "client-visible", accountId: "act_1" }),
    })],
  ])("rejects unauthenticated %s requests", async (_name, handler, req) => {
    state.access = denied(401);
    expect((await handler(req as never)).status).toBe(401);
  });

  it("rejects fabricated and unauthorized client sessions", async () => {
    state.access = denied(401, "Invalid or expired session.");
    expect((await status.GET(request("/?clientId=client-visible", {
      headers: { cookie: "authjs.session-token=fabricated" },
    }) as never)).status).toBe(401);
    state.access = denied(403, "You do not have access to this client.");
    expect((await insights.GET(request("/?clientId=client-hidden") as never)).status).toBe(403);
  });

  it("reports missing connection and account states", async () => {
    state.connection = null;
    const disconnected = await insights.GET(request("/?clientId=client-visible") as never);
    expect(disconnected.status).toBe(401);
    state.connection = { accessToken: "access-token-secret" };
    const missing = await insights.GET(request("/?clientId=client-visible") as never);
    expect(missing.status).toBe(400);
  });

  it("rejects malformed and inaccessible account selections", async () => {
    const malformed = await account.POST(request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: "client-visible" }),
    }) as never);
    expect(malformed.status).toBe(400);
    const unavailable = await account.POST(request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: "client-visible", accountId: "act_missing" }),
    }) as never);
    expect(unavailable.status).toBe(404);
  });

  it("saves an accessible Meta account", async () => {
    const response = await account.POST(request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: "client-visible", accountId: "act_1" }),
    }) as never);
    expect(response.status).toBe(200);
    expect(await body(response)).toMatchObject({ ok: true, account: { id: "act_1" } });
  });

  it("returns connected status without leaking the access token", async () => {
    const response = await status.GET(request("/?clientId=client-visible") as never);
    const payload = await body(response);
    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ connected: true, selectedAccountId: "act_1" });
    expectNoSecrets(payload);
  });

  it("returns report rows and surfaces provider HTTP failure", async () => {
    const success = await insights.GET(request("/?clientId=client-visible") as never);
    expect(success.status).toBe(200);
    expect(Array.isArray((await body(success)).rows)).toBe(true);
    state.providerFailure = true;
    const failure = await insights.GET(request("/?clientId=client-visible") as never);
    expect(failure.status).toBe(500);
    expect((await body(failure)).error).toContain("HTTP 503");
  });

  it("allows authorized disconnect and rejects non-manager disconnect", async () => {
    expect((await status.DELETE(request("/?clientId=client-visible") as never)).status).toBe(200);
    state.access = denied(403);
    expect((await status.DELETE(request("/?clientId=client-visible") as never)).status).toBe(403);
  });
});
