import assert from "node:assert/strict";
import test from "node:test";

const {
  executeWithTokenRefresh,
  shouldRefreshAccessToken,
} = await import("../src/lib/providerTokenManager.ts");

const now = Date.parse("2026-07-23T12:00:00.000Z");

test("valid access token is used without refresh", async () => {
  let refreshes = 0;
  const result = await executeWithTokenRefresh({
    accessToken: "valid",
    refreshToken: "refresh",
    accessTokenExpiresAt: "2026-07-23T13:00:00.000Z",
    now: () => now,
    refresh: async () => {
      refreshes += 1;
      return { accessToken: "new" };
    },
    persist: async () => {},
    operation: async (token) => token,
  });
  assert.equal(result, "valid");
  assert.equal(refreshes, 0);
});

test("expiring and expired tokens refresh before the request", async () => {
  assert.equal(
    shouldRefreshAccessToken("2026-07-23T12:04:00.000Z", now),
    true
  );
  assert.equal(
    shouldRefreshAccessToken("2026-07-23T11:59:00.000Z", now),
    true
  );
  const persisted = [];
  const result = await executeWithTokenRefresh({
    accessToken: "old",
    refreshToken: "refresh",
    accessTokenExpiresAt: "2026-07-23T12:04:00.000Z",
    now: () => now,
    refresh: async () => ({
      accessToken: "new",
      refreshToken: "rotated",
      expiresInSeconds: 3600,
    }),
    persist: async (tokens) => persisted.push(tokens),
    operation: async (token) => token,
  });
  assert.equal(result, "new");
  assert.equal(persisted[0].refreshToken, "rotated");
  assert.equal(persisted[0].accessTokenExpiresAt, "2026-07-23T13:00:00.000Z");
});

test("an authenticated request failure refreshes and retries exactly once", async () => {
  let calls = 0;
  let refreshes = 0;
  const result = await executeWithTokenRefresh({
    accessToken: "old",
    refreshToken: "refresh",
    accessTokenExpiresAt: "2026-07-23T13:00:00.000Z",
    now: () => now,
    refresh: async () => {
      refreshes += 1;
      return { accessToken: "new" };
    },
    persist: async () => {},
    operation: async (token) => {
      calls += 1;
      if (token === "old") throw new Error("401: access token expired");
      return token;
    },
  });
  assert.equal(result, "new");
  assert.equal(refreshes, 1);
  assert.equal(calls, 2);
});

test("failed refresh is surfaced and the provider request is not attempted", async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      executeWithTokenRefresh({
        accessToken: "old",
        refreshToken: "refresh",
        accessTokenExpiresAt: "2026-07-23T11:00:00.000Z",
        now: () => now,
        refresh: async () => {
          throw new Error("refresh failed");
        },
        persist: async () => {},
        operation: async () => {
          calls += 1;
        },
      }),
    /refresh failed/
  );
  assert.equal(calls, 0);
});

test("revoked refresh token does not cause a retry loop", async () => {
  let refreshes = 0;
  await assert.rejects(
    () =>
      executeWithTokenRefresh({
        accessToken: "old",
        refreshToken: "revoked",
        accessTokenExpiresAt: "2026-07-23T13:00:00.000Z",
        now: () => now,
        refresh: async () => {
          refreshes += 1;
          throw new Error("refresh token revoked");
        },
        persist: async () => {},
        operation: async () => {
          throw new Error("401: invalid token");
        },
      }),
    /revoked/
  );
  assert.equal(refreshes, 1);
});

test("expired token without a refresh token fails clearly", async () => {
  await assert.rejects(
    () =>
      executeWithTokenRefresh({
        accessToken: "old",
        refreshToken: null,
        accessTokenExpiresAt: "2026-07-23T11:00:00.000Z",
        now: () => now,
        refresh: async () => ({ accessToken: "unused" }),
        persist: async () => {},
        operation: async () => "unused",
      }),
    /no refresh token/i
  );
});
