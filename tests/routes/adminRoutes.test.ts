import { beforeEach, describe, expect, it, vi } from "vitest";
import { allowed, body, denied, expectNoSecrets, request, visibleClient } from "./routeTestUtils";

const state = vi.hoisted(() => ({
  auth: null as unknown,
  clients: [] as Array<Record<string, unknown>>,
  mappings: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/lib/serverAccess", () => ({
  requireAuthenticatedUser: vi.fn(async () => state.auth ?? allowed()),
  requireClientManagementAccess: vi.fn(async () => state.auth ?? allowed()),
}));
vi.mock("@/lib/accessControl", () => ({
  getVisibleClientsForUser: vi.fn(async (_user, clients) => clients),
}));
vi.mock("@/lib/clientStore", () => ({
  listClients: vi.fn(async () => state.clients),
  createClient: vi.fn(async (input) => {
    const client = { ...visibleClient, ...input };
    state.clients.push(client);
    return client;
  }),
  updateClient: vi.fn(async (input) => {
    const client = { ...visibleClient, ...input, id: input.clientId };
    state.clients = state.clients.map((item) => item.id === input.clientId ? client : item);
    return client;
  }),
  updateClientStoreAccess: vi.fn(async ({ clientId, storeAccessDeclined }) => ({
    ...visibleClient,
    id: clientId,
    storeAccessDeclined,
  })),
  getClientStoreMeta: vi.fn(() => ({ durable: true, location: "test-store" })),
  getClientStoreHealth: vi.fn(async () => ({ reachable: true, durable: true })),
  getRequiredClientById: vi.fn(async () => visibleClient),
}));
vi.mock("@/lib/clientLifecycle", () => ({
  deleteClientAndScopedData: vi.fn(async (clientId) => {
    state.clients = state.clients.filter((item) => item.id !== clientId);
    return { clientId, deleted: true, preservedGlobalDefaults: true };
  }),
}));
vi.mock("@/lib/sourceConversionMappingStore", () => ({
  listSourceConversionMappings: vi.fn(async () => state.mappings),
  resolveSourceConversionMapping: vi.fn(async (sourceType, clientId) => ({
    sourceType,
    clientId,
    status: state.mappings.length ? "mapped" : "missing_mapping",
  })),
  upsertSourceConversionMapping: vi.fn(async (mapping) => {
    state.mappings.push(mapping);
    return mapping;
  }),
}));

import * as clients from "@/app/api/admin/clients/route";
import * as mappings from "@/app/api/admin/source-conversion-mappings/route";

describe("Admin client CRUD route", () => {
  beforeEach(() => {
    state.auth = allowed();
    state.clients = [{ ...visibleClient }];
  });

  it.each([
    ["GET", clients.GET, request("/")],
    ["POST", clients.POST, request("/", { method: "POST", body: "{}" })],
    ["PATCH", clients.PATCH, request("/", { method: "PATCH", body: "{}" })],
    ["DELETE", clients.DELETE, request("/?clientId=client-visible", { method: "DELETE" })],
  ])("%s rejects unauthenticated requests", async (_method, handler, req) => {
    state.auth = denied(401);
    expect((await handler(req as never)).status).toBe(401);
  });

  it("lists only visible clients with storage diagnostics", async () => {
    const response = await clients.GET(request("/") as never);
    const payload = await body(response);
    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      activeClientId: "client-visible",
      storage: { durable: true },
      storageHealth: { reachable: true },
    });
    expectNoSecrets(payload);
  });

  it("rejects non-admin client creation", async () => {
    state.auth = denied(403, "Owner or admin access is required.");
    expect((await clients.POST(request("/", { method: "POST", body: "{}" }) as never)).status).toBe(403);
  });

  it("rejects malformed client creation", async () => {
    const response = await clients.POST(request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "  " }),
    }) as never);
    expect(response.status).toBe(400);
    expect(await body(response)).toEqual({ error: "Client name is required." });
  });

  it("creates a client with a stable response shape", async () => {
    const response = await clients.POST(request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "New Client", websitePlatform: "shopify", currencyCode: "AED" }),
    }) as never);
    expect(response.status).toBe(201);
    expect(await body(response)).toMatchObject({ client: { name: "New Client", currencyCode: "AED" } });
  });

  it("updates a visible client and rejects a missing client ID", async () => {
    const missing = await clients.PATCH(request("/", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Changed" }),
    }) as never);
    expect(missing.status).toBe(400);
    const response = await clients.PATCH(request("/", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: "client-visible", name: "Changed", currencyCode: "AED" }),
    }) as never);
    expect(response.status).toBe(200);
    expect(await body(response)).toMatchObject({ client: { id: "client-visible", name: "Changed" } });
  });

  it("deletes a client last and reports rollback-safe scoped cleanup", async () => {
    const response = await clients.DELETE(request("/?clientId=client-visible", { method: "DELETE" }) as never);
    expect(response.status).toBe(200);
    expect(await body(response)).toMatchObject({
      ok: true,
      deletedClientId: "client-visible",
      cleanup: { preservedGlobalDefaults: true },
    });
  });
});

describe("source conversion mapping API", () => {
  beforeEach(() => {
    state.auth = allowed();
    state.mappings = [];
  });

  it.each([mappings.GET, mappings.PUT])("requires management authorization", async (handler) => {
    state.auth = denied(403);
    const req = request("/?clientId=client-visible", {
      method: handler === mappings.PUT ? "PUT" : "GET",
      headers: { "content-type": "application/json" },
      body: handler === mappings.PUT ? "{}" : undefined,
    });
    expect((await handler(req as never)).status).toBe(403);
  });

  it("returns missing mappings explicitly without fallback", async () => {
    const response = await mappings.GET(request("/?clientId=client-visible") as never);
    const payload = await body(response);
    expect(response.status).toBe(200);
    expect(payload.resolved).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceType: "meta", status: "missing_mapping" }),
    ]));
  });

  it("rejects malformed and client-scoped mappings without a client ID", async () => {
    const unsupported = await mappings.PUT(request("/", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceType: "unknown" }),
    }) as never);
    expect(unsupported.status).toBe(400);
    const missingClient = await mappings.PUT(request("/", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceType: "meta", scope: "client" }),
    }) as never);
    expect(missingClient.status).toBe(400);
  });

  it("saves an exact mapping and returns its resolved shape", async () => {
    const response = await mappings.PUT(request("/", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceType: "meta",
        scope: "client",
        clientId: "client-visible",
        purchasesEvent: "purchase",
        purchaseValueEvent: "purchase_value",
        enabled: true,
      }),
    }) as never);
    expect(response.status).toBe(200);
    expect(await body(response)).toMatchObject({
      mapping: { purchasesEvent: "purchase", purchaseValueEvent: "purchase_value" },
      resolved: { status: "mapped" },
    });
  });
});
