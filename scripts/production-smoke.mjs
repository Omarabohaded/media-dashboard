const base = (process.env.SMOKE_BASE_URL || "https://media-dashboard-psi.vercel.app").replace(/\/$/, "");
const checks = [
  ["/login", [200]],
  ["/", [200, 307]],
  ["/admin", [200, 307]],
  ["/paid-media", [200, 307]],
  ["/portfolio", [200, 307]],
  ["/health", [200, 307]],
  ["/api/health/integrations", [401]],
  ["/api/reports/client", [401]],
  ["/api/reports/portfolio", [401]],
  ["/api/integrations/tiktok/status", [401]],
  ["/api/integrations/google/status", [401]],
  ["/api/integrations/snap/status", [401]],
];
let failed = 0;
for (const [path, expected] of checks) {
  const response = await fetch(`${base}${path}`, { redirect: "manual" });
  const ok = expected.includes(response.status);
  console.log(`${ok ? "PASS" : "FAIL"} ${path} ${response.status}`);
  if (!ok) failed += 1;
}
if (failed) process.exitCode = 1;
