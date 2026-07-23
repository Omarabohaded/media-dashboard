import assert from "node:assert/strict";
import test from "node:test";

process.env.GOOGLE_ADS_CLIENT_ID = "google-client";
process.env.GOOGLE_ADS_CLIENT_SECRET = "google-secret";
process.env.GOOGLE_ADS_DEVELOPER_TOKEN = "developer-token";
process.env.SNAP_CLIENT_ID = "snap-client";
process.env.SNAP_CLIENT_SECRET = "snap-secret";

const originalFetch = globalThis.fetch;
const google = await import("../src/lib/integrations/googleAds.ts");
const snap = await import("../src/lib/integrations/snap.ts");

test.after(() => {
  globalThis.fetch = originalFetch;
});

test("Google OAuth callback exchange and refresh use official token contracts", async () => {
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url, body: String(init.body) });
    return Response.json({
      access_token: requests.length === 1 ? "access" : "refreshed",
      refresh_token: "refresh",
      expires_in: 3600,
    });
  };
  assert.equal(
    (await google.exchangeGoogleAdsCode("code", "https://dashboard.test")).access_token,
    "access"
  );
  assert.equal(
    (await google.refreshGoogleAdsAccessToken("refresh")).access_token,
    "refreshed"
  );
  assert.match(requests[0].body, /grant_type=authorization_code/);
  assert.match(requests[1].body, /grant_type=refresh_token/);
});

test("Google customer discovery enriches display names and falls back honestly", async () => {
  let request = 0;
  globalThis.fetch = async () => {
    request += 1;
    if (request === 1) {
      return Response.json({
        resourceNames: ["customers/111", "customers/222"],
      });
    }
    if (request === 2) {
      return Response.json([
        {
          results: [
            {
              customer: {
                descriptiveName: "Primary Account",
                currencyCode: "AED",
              },
            },
          ],
        },
      ]);
    }
    return Response.json({ error: { message: "metadata unavailable" } }, { status: 500 });
  };
  const customers = await google.fetchGoogleAdsCustomers("token");
  assert.deepEqual(customers[0], {
    customerId: "111",
    customerName: "Primary Account",
    resourceName: "customers/111",
    currencyCode: "AED",
  });
  assert.equal(customers[1].customerName, "customers/222");
  assert.equal(customers[1].currencyCode, null);
});

test("Google conversion discovery uses enabled conversion actions", async () => {
  globalThis.fetch = async (_url, init) => {
    assert.match(String(init.body), /conversion_action\.status = 'ENABLED'/);
    return Response.json([
      {
        results: [
          {
            conversionAction: {
              resourceName: "customers/111/conversionActions/1",
              name: "Purchase",
            },
          },
        ],
      },
    ]);
  };
  const events = await google.fetchGoogleAdsConversionEvents("token", "111");
  assert.equal(events[0].label, "Purchase");
  assert.equal(events[0].eventName, "customers/111/conversionActions/1");
});

test("Snap OAuth exchange and refresh use official token contracts", async () => {
  const bodies = [];
  globalThis.fetch = async (_url, init) => {
    bodies.push(String(init.body));
    return Response.json({
      access_token: bodies.length === 1 ? "access" : "refreshed",
      refresh_token: "refresh",
      expires_in: 3600,
    });
  };
  await snap.exchangeSnapCode("code", "https://dashboard.test");
  await snap.refreshSnapAccessToken("refresh");
  assert.match(bodies[0], /grant_type=authorization_code/);
  assert.match(bodies[1], /grant_type=refresh_token/);
});

test("Snap organization/account parsing and metric catalog are explicit", async () => {
  globalThis.fetch = async () =>
    Response.json({
      request_status: "SUCCESS",
      organizations: [
        {
          organization: {
            id: "org-1",
            ad_accounts: [{ id: "account-1", name: "Snap Account" }],
          },
        },
      ],
    });
  const accounts = await snap.fetchSnapAdAccounts("token");
  assert.deepEqual(accounts[0], {
    adAccountId: "account-1",
    adAccountName: "Snap Account",
    organizationId: "org-1",
  });
  const catalog = snap.getSupportedSnapMetricCatalog("client-1");
  assert.deepEqual(
    catalog.map((event) => event.eventName),
    ["conversion_purchases", "conversion_purchases_value"]
  );
});
