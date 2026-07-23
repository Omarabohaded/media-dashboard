import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IntegrationHealthPanel } from "@/components/IntegrationHealthPanel";

function response(payload: unknown, ok = true) {
  return Promise.resolve({ ok, json: async () => payload } as Response);
}

describe("Integration Health rendered states", () => {
  it("renders loading then all operational health states with actionable messages", async () => {
    vi.stubGlobal("fetch", vi.fn(() => response({
      checkedAt: "2026-07-23T12:00:00.000Z",
      summary: { total: 8, healthy: 1, needsAction: 7, failed: 1, expired: 1, stale: 1 },
      storage: { durable: true, message: "Durable runtime storage is healthy." },
      records: [
        { clientId: "1", clientName: "Healthy Client", sourceType: "meta", status: "healthy", selectedAccountId: "m1", mappingStatus: "mapped", tokenExpiresAt: null, lastSuccessfulSyncAt: "2026-07-23", lastAttemptAt: "2026-07-23", lastError: null, dataFreshness: "fresh", nextAction: "No action required." },
        { clientId: "2", clientName: "Never Client", sourceType: "tiktok", status: "never_synced", selectedAccountId: "t1", mappingStatus: "mapped", tokenExpiresAt: null, lastSuccessfulSyncAt: null, lastAttemptAt: null, lastError: null, dataFreshness: "never", nextAction: "Run the first sync." },
        { clientId: "3", clientName: "Stale Client", sourceType: "google", status: "stale", selectedAccountId: "g1", mappingStatus: "mapped", tokenExpiresAt: null, lastSuccessfulSyncAt: "2026-07-01", lastAttemptAt: "2026-07-01", lastError: null, dataFreshness: "stale", nextAction: "Refresh stale data." },
        { clientId: "4", clientName: "Failed Client", sourceType: "snap", status: "failed", selectedAccountId: "s1", mappingStatus: "mapped", tokenExpiresAt: null, lastSuccessfulSyncAt: null, lastAttemptAt: "2026-07-23", lastError: "Refresh failed", dataFreshness: "never", nextAction: "Reconnect." },
        { clientId: "5", clientName: "Expired Client", sourceType: "tiktok", status: "token_expired", selectedAccountId: "t2", mappingStatus: "mapped", tokenExpiresAt: "2026-01-01", lastSuccessfulSyncAt: null, lastAttemptAt: null, lastError: null, dataFreshness: "never", nextAction: "Reconnect token." },
        { clientId: "6", clientName: "Account Client", sourceType: "google", status: "missing_account", selectedAccountId: null, mappingStatus: "mapped", tokenExpiresAt: null, lastSuccessfulSyncAt: null, lastAttemptAt: null, lastError: null, dataFreshness: "never", nextAction: "Select account." },
        { clientId: "7", clientName: "Mapping Client", sourceType: "meta", status: "missing_mapping", selectedAccountId: "m2", mappingStatus: "missing_mapping", tokenExpiresAt: null, lastSuccessfulSyncAt: null, lastAttemptAt: null, lastError: null, dataFreshness: "never", nextAction: "Map conversions." },
        { clientId: "8", clientName: "Unavailable Client", sourceType: "snap", status: "disconnected", selectedAccountId: null, mappingStatus: "missing_mapping", tokenExpiresAt: null, lastSuccessfulSyncAt: null, lastAttemptAt: null, lastError: "Platform unavailable", dataFreshness: "never", nextAction: "Connect platform." },
      ],
    })));
    render(<IntegrationHealthPanel />);
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(await screen.findByText("7 need action")).toBeInTheDocument();
    expect(screen.getByText("Durable runtime storage is healthy.")).toBeInTheDocument();
    for (const text of ["healthy", "never synced", "stale", "failed", "token expired", "missing account", "missing mapping", "disconnected"]) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/Error: Refresh failed/)).toBeInTheDocument();
    expect(screen.getByText(/Error: Platform unavailable/)).toBeInTheDocument();
  });

  it("renders unauthorized and platform failure messaging", async () => {
    vi.stubGlobal("fetch", vi.fn(() => response({ error: "Unauthorized" }, false)));
    render(<IntegrationHealthPanel />);
    expect(await screen.findByText("Unauthorized")).toBeInTheDocument();
  });
});
