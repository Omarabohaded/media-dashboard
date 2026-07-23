import { beforeEach, describe, expect, it, vi } from "vitest";
import { allowed, denied, request, visibleClient } from "./routeTestUtils";

const state = vi.hoisted(() => ({
  access: null as unknown,
  exchangeFailure: false,
}));

vi.mock("@/lib/serverAccess", () => ({
  requireClientIntegrationAccess: vi.fn(async () => state.access ?? allowed()),
}));
vi.mock("@/lib/clientStore", () => ({
  getClientById: vi.fn(async () => visibleClient),
  getRequiredClientById: vi.fn(async () => visibleClient),
  upsertMetaConnection: vi.fn(async (value) => value),
}));
vi.mock("@/lib/tiktokConnectionStore", () => ({ upsertTikTokConnection: vi.fn(async (value) => value) }));
vi.mock("@/lib/googleAdsConnectionStore", () => ({ upsertGoogleAdsConnection: vi.fn(async (value) => value) }));
vi.mock("@/lib/snapConnectionStore", () => ({ upsertSnapConnection: vi.fn(async (value) => value) }));

vi.mock("@/lib/integrations/tiktok", () => ({
  TIKTOK_STATE_COOKIE: "tt-state",
  TIKTOK_OAUTH_CLIENT_COOKIE: "tt-client",
  buildTikTokOauthUrl: vi.fn(() => "https://provider.test/tiktok"),
  exchangeTikTokCode: vi.fn(async () => {
    if (state.exchangeFailure) throw new Error("TikTok exchange failed");
    return { access_token: "access-token-secret", refresh_token: "refresh-token-secret", expires_in: 3600 };
  }),
  fetchTikTokAdvertisers: vi.fn(async () => [{ advertiserId: "tt-1", advertiserName: "TikTok Account" }]),
  getTikTokConfig: vi.fn(() => ({ missingEnv: [] })),
  getSecureCookieFlag: vi.fn(() => true),
}));
vi.mock("@/lib/integrations/googleAds", () => ({
  GOOGLE_ADS_STATE_COOKIE: "g-state",
  GOOGLE_ADS_CLIENT_COOKIE: "g-client",
  buildGoogleAdsOauthUrl: vi.fn(() => "https://provider.test/google"),
  exchangeGoogleAdsCode: vi.fn(async () => {
    if (state.exchangeFailure) throw new Error("Google exchange failed");
    return { access_token: "access-token-secret", refresh_token: "refresh-token-secret", expires_in: 3600 };
  }),
  fetchGoogleAdsCustomers: vi.fn(async () => [{ customerId: "g-1", customerName: "Google Account" }]),
  getGoogleAdsConfig: vi.fn(() => ({ missingEnv: [] })),
}));
vi.mock("@/lib/integrations/snap", () => ({
  SNAP_STATE_COOKIE: "s-state",
  SNAP_CLIENT_COOKIE: "s-client",
  buildSnapOauthUrl: vi.fn(() => "https://provider.test/snap"),
  exchangeSnapCode: vi.fn(async () => {
    if (state.exchangeFailure) throw new Error("Snap exchange failed");
    return { access_token: "access-token-secret", refresh_token: "refresh-token-secret", expires_in: 3600 };
  }),
  fetchSnapAdAccounts: vi.fn(async () => [{ adAccountId: "s-1", adAccountName: "Snap Account" }]),
  getSnapConfig: vi.fn(() => ({ missingEnv: [] })),
}));
vi.mock("@/lib/integrations/meta", () => ({
  META_STATE_COOKIE: "m-state",
  META_OAUTH_CLIENT_COOKIE: "m-client",
  buildMetaOauthUrl: vi.fn(() => "https://provider.test/meta"),
  exchangeMetaCodeForToken: vi.fn(async () => {
    if (state.exchangeFailure) throw new Error("Meta exchange failed");
    return { access_token: "access-token-secret" };
  }),
  fetchMetaAdAccounts: vi.fn(async () => [{ id: "m-1", name: "Meta Account" }]),
  getMetaConfig: vi.fn(() => ({ missingEnv: [] })),
  getSecureCookieFlag: vi.fn(() => true),
}));

import * as tiktokConnect from "@/app/api/integrations/tiktok/connect/route";
import * as tiktokCallback from "@/app/api/integrations/tiktok/callback/route";
import * as googleConnect from "@/app/api/integrations/google/connect/route";
import * as googleCallback from "@/app/api/integrations/google/callback/route";
import * as snapConnect from "@/app/api/integrations/snap/connect/route";
import * as snapCallback from "@/app/api/integrations/snap/callback/route";
import * as metaConnect from "@/app/api/integrations/meta/connect/route";
import * as metaCallback from "@/app/api/integrations/meta/callback/route";

const providers = [
  { name: "TikTok", connect: tiktokConnect.GET, callback: tiktokCallback.GET, state: "tt-state", client: "tt-client" },
  { name: "Google Ads", connect: googleConnect.GET, callback: googleCallback.GET, state: "g-state", client: "g-client" },
  { name: "Snapchat", connect: snapConnect.GET, callback: snapCallback.GET, state: "s-state", client: "s-client" },
  { name: "Meta", connect: metaConnect.GET, callback: metaCallback.GET, state: "m-state", client: "m-client" },
] as const;

for (const provider of providers) {
  describe(`${provider.name} OAuth routes`, () => {
    beforeEach(() => {
      state.access = allowed();
      state.exchangeFailure = false;
    });

    it("rejects unauthenticated connect requests", async () => {
      state.access = denied(401);
      expect((await provider.connect(request("/?clientId=client-visible") as never)).status).toBe(401);
    });

    it("redirects an authorized connect and writes HttpOnly state/client cookies", async () => {
      const response = await provider.connect(request("/?clientId=client-visible") as never);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("provider.test");
      const cookies = response.headers.get("set-cookie") ?? "";
      expect(cookies).toContain("HttpOnly");
      expect(cookies).not.toContain("access-token-secret");
    });

    it("redirects missing callback context without exchanging tokens", async () => {
      const response = await provider.callback(request("/?code=code&state=expected") as never);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toMatch(/missing_oauth_client|invalid_oauth_state/);
    });

    it("rejects unauthorized callback client context", async () => {
      state.access = denied(403);
      const response = await provider.callback(request("/?code=code&state=expected", {
        headers: { cookie: `${provider.client}=client-visible; ${provider.state}=expected` },
      }) as never);
      expect(response.status).toBe(403);
    });

    it("redirects invalid OAuth state and never leaks secrets", async () => {
      const response = await provider.callback(request("/?code=code&state=wrong", {
        headers: { cookie: `${provider.client}=client-visible; ${provider.state}=expected` },
      }) as never);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("error");
      expect(response.headers.get("location")).not.toContain("access-token-secret");
    });
  });
}
