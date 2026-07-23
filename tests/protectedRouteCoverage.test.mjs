import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const protectedRoutes = [
  "admin/clients",
  "admin/metric-mappings",
  "admin/metrics",
  "admin/source-conversion-mappings",
  "admin/users",
  "dashboard/metric-logic",
  "dashboard/multi-store-view",
  "dashboard/paid-media",
  "health/integrations",
  "reports/client",
  "reports/portfolio",
  "sync/run",
  "sync/state",
  ...["meta", "tiktok", "google", "snap"].flatMap((platform) => {
    const handlers = platform === "meta"
      ? ["account", "callback", "connect", "insights-preview", "status"]
      : ["accounts", "callback", "connect", "events-preview", "report-preview", "status"];
    return handlers.map((handler) => `integrations/${platform}/${handler}`);
  }),
];

const guardPattern =
  /require(?:AuthenticatedUser|AdminAccess|UserManagementAccess|ClientManagementAccess|ClientAccess|ClientIntegrationAccess)\s*\(/;

for (const route of protectedRoutes) {
  test(`${route} has a handler-level authorization guard`, async () => {
    const source = await readFile(`src/app/api/${route}/route.ts`, "utf8");
    assert.match(source, guardPattern);
  });
}

test("middleware validates a decoded session rather than cookie-name presence", async () => {
  const source = await readFile("middleware.ts", "utf8");
  assert.match(source, /hasValidAuthenticatedSession\(request\.auth\)/);
  assert.doesNotMatch(source, /authjs\.session-token|next-auth\.session-token/);
});
