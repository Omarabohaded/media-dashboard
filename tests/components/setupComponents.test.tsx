import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPaidMediaSetup } from "@/components/AdminPaidMediaSetup";
import { GoogleAdsSetup } from "@/components/GoogleAdsSetup";
import { SnapAdsSetup } from "@/components/SnapAdsSetup";

function response(payload: unknown, ok = true, status = ok ? 200 : 500) {
  return Promise.resolve({
    ok,
    status,
    json: async () => payload,
  } as Response);
}

describe("Admin conversion mapping and TikTok setup", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/tiktok/status")) {
        return response({
          configured: true,
          connected: true,
          accounts: [{ advertiserId: "tt-1", advertiserName: "Main Advertiser" }],
          selectedAdvertiserId: "tt-1",
          selectedAdvertiser: { advertiserId: "tt-1", advertiserName: "Main Advertiser" },
          missingEnv: [],
          connectionError: null,
          tokenExpired: false,
          lastDiscoveryAt: null,
          mappingHealthy: false,
          recommendedNextStep: "Map purchase events.",
        });
      }
      if (url.includes("/source-conversion-mappings") && !init?.method) {
        return response({
          mappings: [],
          resolved: [{ sourceType: "tiktok", status: "missing_mapping", purchasesEvent: null, purchaseValueEvent: null }],
        });
      }
      if (url.includes("/events-preview")) {
        return response({
          events: [
            { eventName: "purchase", label: "Purchase", roles: ["purchases"] },
            { eventName: "value", label: "Purchase value", roles: ["purchaseValue"] },
          ],
        });
      }
      if (url.includes("/source-conversion-mappings") && init?.method === "PUT") {
        return response({ resolved: { status: "mapped" } });
      }
      return response({ ok: true });
    }));
  });

  it("renders loading then connected/missing-mapping state", async () => {
    render(<AdminPaidMediaSetup clientId="client-visible" />);
    expect(screen.getByText("Loading status…")).toBeInTheDocument();
    expect(await screen.findByText("Connected")).toBeInTheDocument();
    expect(screen.getByText(/Resolved status: missing mapping/i)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Main Advertiser/ })).toBeInTheDocument();
  });

  it("discovers visible events and saves an exact mapping", async () => {
    const user = userEvent.setup();
    render(<AdminPaidMediaSetup clientId="client-visible" />);
    await screen.findByText("Connected");
    await user.click(screen.getByRole("button", { name: "Discover events" }));
    expect(await screen.findByText("Detected 2 TikTok events.")).toBeInTheDocument();
    const purchases = screen.getByPlaceholderText("Purchases event");
    const value = screen.getByPlaceholderText("Purchase-value event");
    await user.clear(purchases);
    await user.type(purchases, "purchase");
    await user.clear(value);
    await user.type(value, "value");
    await user.click(screen.getByRole("button", { name: "Save mapping" }));
    expect(await screen.findByText("Conversion mapping saved.")).toBeInTheDocument();
    expect(screen.getByText(/Resolved status: mapped/i)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/source-conversion-mappings",
      expect.objectContaining({
        method: "PUT",
        body: expect.stringContaining('"purchasesEvent":"purchase"'),
      })
    );
  });

  it("surfaces disconnected, token-expired, and failed-discovery states", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.includes("/tiktok/status")) {
        return response({
          configured: false,
          connected: true,
          accounts: [],
          selectedAdvertiserId: null,
          selectedAdvertiser: null,
          missingEnv: ["TIKTOK_CLIENT_KEY"],
          connectionError: "Refresh failed",
          tokenExpired: true,
          lastDiscoveryAt: null,
          mappingHealthy: false,
          recommendedNextStep: "Reconnect TikTok.",
        });
      }
      if (url.includes("/events-preview")) return response({ error: "Provider unavailable" }, false, 503);
      return response({ mappings: [], resolved: [] });
    });
    render(<AdminPaidMediaSetup clientId="client-visible" />);
    expect(await screen.findByText("Token expired")).toBeInTheDocument();
    expect(screen.getByText(/Awaiting live validation: TIKTOK_CLIENT_KEY/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Discover events" }));
    expect(await screen.findByText("Provider unavailable")).toBeInTheDocument();
  });
});

const setupCases = [
  {
    name: "Google Ads",
    Component: GoogleAdsSetup,
    statusPath: "/google/status",
    accountLabel: "Google Customer",
    account: { customerId: "g-1", customerName: "Google Customer" },
    saveButton: "Save customer",
    discoverButton: "Discover conversions",
    saved: "Google Ads customer saved.",
    detected: "Detected 1 Google Ads conversion actions.",
  },
  {
    name: "Snapchat",
    Component: SnapAdsSetup,
    statusPath: "/snap/status",
    accountLabel: "Snap Account",
    account: { adAccountId: "s-1", adAccountName: "Snap Account" },
    saveButton: "Save account",
    discoverButton: "Discover conversions",
    saved: "Snap ad account saved.",
    detected: "Loaded 1 supported Snap conversion metrics.",
  },
] as const;

for (const setup of setupCases) {
  describe(`${setup.name} rendered setup`, () => {
    it("renders connected, account, mapping, action success, and refresh failure states", async () => {
      let statusCalls = 0;
      vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes(setup.statusPath)) {
          statusCalls += 1;
          return response({
            configured: true,
            connected: true,
            missingEnv: [],
            accounts: [setup.account],
            selectedAccountId: Object.values(setup.account)[0],
            tokenExpired: false,
            mappingHealthy: true,
            connectionError: statusCalls > 1 ? "Refresh failed" : null,
            implementationStatus: "implemented_awaiting_live_validation",
          });
        }
        if (url.includes("/events-preview")) return response({ events: [{}] });
        if (init?.method === "POST") return response({ ok: true });
        return response({});
      }));
      const user = userEvent.setup();
      render(<setup.Component clientId="client-visible" />);
      expect(await screen.findByText("Connected")).toBeInTheDocument();
      expect(screen.getByRole("option", { name: new RegExp(setup.accountLabel) })).toBeInTheDocument();
      expect(screen.getByText(/Mapping: healthy/)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: setup.saveButton }));
      expect(await screen.findByText(setup.saved)).toBeInTheDocument();
      expect(await screen.findByText(/Refresh failed/)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: setup.discoverButton }));
      expect(await screen.findByText(new RegExp(setup.detected))).toBeInTheDocument();
    });

    it("renders disconnected, missing config, missing mapping, token expiry, and platform failure", async () => {
      vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes(setup.statusPath)) {
          return response({
            configured: false,
            connected: true,
            missingEnv: ["PROVIDER_CLIENT_ID"],
            accounts: [],
            selectedAccountId: null,
            tokenExpired: true,
            mappingHealthy: false,
            connectionError: "Platform unavailable",
          });
        }
        return response({ error: "Platform unavailable" }, false, 503);
      }));
      render(<setup.Component clientId="client-visible" />);
      expect(await screen.findByText("Token expired")).toBeInTheDocument();
      expect(screen.getByText(/External setup deferred: PROVIDER_CLIENT_ID/)).toBeInTheDocument();
      expect(screen.getByText(/Mapping: missing · Platform unavailable/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: setup.saveButton })).toBeDisabled();
    });
  });
}
