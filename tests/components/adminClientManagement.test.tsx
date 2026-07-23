import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const childProps = vi.hoisted(() => ({ paid: "", google: "", snap: "" }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    status: "authenticated",
    data: { user: { id: "owner-1", name: "Owner", email: "owner@example.test", role: "owner" } },
  }),
  signOut: vi.fn(),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={String(href)} {...props}>{children}</a>,
}));
vi.mock("@/components/WooCommerceConnectionCard", () => ({ WooCommerceConnectionCard: () => <div>WooCommerce setup</div> }));
vi.mock("@/components/AdminPaidMediaSetup", () => ({ AdminPaidMediaSetup: ({ clientId }: { clientId: string }) => { childProps.paid = clientId; return <div>Paid setup {clientId}</div>; } }));
vi.mock("@/components/GoogleAdsSetup", () => ({ GoogleAdsSetup: ({ clientId }: { clientId: string }) => { childProps.google = clientId; return <div>Google setup {clientId}</div>; } }));
vi.mock("@/components/SnapAdsSetup", () => ({ SnapAdsSetup: ({ clientId }: { clientId: string }) => { childProps.snap = clientId; return <div>Snap setup {clientId}</div>; } }));

import { AppShell } from "@/components/AppShell";
import AdminPage from "@/app/admin/page";
import { ACTIVE_CLIENT_CHANGE_EVENT, ACTIVE_CLIENT_STORAGE_KEY } from "@/lib/clientContext";

const first = { id: "client-one", name: "Client One", websitePlatform: "shopify", currencyCode: "AED", notes: "" };
const second = { id: "client-two", name: "Client Two", websitePlatform: "custom", currencyCode: "USD", notes: "" };

function response(payload: unknown, ok = true) {
  return Promise.resolve({ ok, json: async () => payload } as Response);
}

describe("active client selection", () => {
  it("loads persisted selection and propagates user changes to storage and an event", async () => {
    localStorage.setItem(ACTIVE_CLIENT_STORAGE_KEY, "client-one");
    vi.stubGlobal("fetch", vi.fn(() => response({ clients: [first, second], activeClientId: "client-one" })));
    const events: string[] = [];
    window.addEventListener(ACTIVE_CLIENT_CHANGE_EVENT, ((event: CustomEvent<{ clientId: string }>) => {
      events.push(event.detail.clientId);
    }) as EventListener);
    render(<AppShell><div>Dashboard content</div></AppShell>);
    const selector = await screen.findByRole("combobox", { name: "Active client" });
    expect(selector).toHaveValue("client-one");
    await userEvent.selectOptions(selector, "client-two");
    expect(selector).toHaveValue("client-two");
    expect(localStorage.getItem(ACTIVE_CLIENT_STORAGE_KEY)).toBe("client-two");
    expect(events).toContain("client-two");
    expect(screen.getByText("Client Two")).toBeInTheDocument();
  });

  it("hides client controls and content when the directory request is unauthorized", async () => {
    vi.stubGlobal("fetch", vi.fn(() => response({ error: "Unauthorized" }, false)));
    render(<AppShell><div>Dashboard content</div></AppShell>);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByRole("combobox", { name: "Active client" })).not.toBeInTheDocument();
    expect(screen.getByText("No client selected")).toBeInTheDocument();
  });
});

describe("Admin client management rendered workflow", () => {
  beforeEach(() => {
    localStorage.clear();
    childProps.paid = "";
    childProps.google = "";
    childProps.snap = "";
  });

  it("renders durable client state, switches clients, and propagates the active client to setup components", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/admin/clients")) return response({ clients: [first, second], activeClientId: "client-one", storage: { durable: true, location: "Vercel KV" } });
      if (url.includes("/api/sync/state")) return response({ syncRuns: [], storage: { durable: true, location: "Vercel KV" } });
      if (url.includes("/meta/status")) return response({ connected: false, configured: true, selectedAccountId: null, selectedAccount: null, accounts: [], callbackUrl: "", missingEnv: [], connectionError: null, recommendedNextStep: "Connect Meta." });
      if (url.includes("/shopify/status")) return response({ client: first, configured: true, connected: false, previewReady: false, storeDomain: "", shopName: null, missingEnv: [], connectionError: null, recommendedNextStep: "Connect store." });
      return response({});
    }));
    render(<AdminPage />);
    expect(await screen.findByText(/Client storage is durable now through Vercel KV/)).toBeInTheDocument();
    const selectors = await screen.findAllByRole("combobox");
    const clientSelector = selectors.find((element) => element.textContent?.includes("Client One · shopify · AED"));
    expect(clientSelector).toBeDefined();
    await userEvent.selectOptions(clientSelector!, "client-two");
    expect(localStorage.getItem(ACTIVE_CLIENT_STORAGE_KEY)).toBe("client-two");
    await waitFor(() => {
      expect(childProps.paid).toBe("client-two");
      expect(childProps.google).toBe("client-two");
      expect(childProps.snap).toBe("client-two");
    });
  });

  it("validates client creation and shows API authorization/error messaging", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/admin/clients" && init?.method === "POST") return response({ error: "Owner or admin access is required." }, false);
      if (url.includes("/api/admin/clients")) return response({ clients: [first], activeClientId: "client-one", storage: { durable: false, location: "/tmp" } });
      if (url.includes("/api/sync/state")) return response({ syncRuns: [], storage: { durable: false, location: "/tmp" } });
      if (url.includes("/meta/status")) return response({ connected: false, configured: false, selectedAccountId: null, selectedAccount: null, accounts: [], callbackUrl: "", missingEnv: [], connectionError: null, recommendedNextStep: "Connect Meta." });
      if (url.includes("/shopify/status")) return response({ client: first, configured: false, connected: false, previewReady: false, storeDomain: "", shopName: null, missingEnv: [], connectionError: null, recommendedNextStep: "Connect store." });
      return response({});
    }));
    render(<AdminPage />);
    await screen.findByText(/Client storage is temporary through \/tmp/);
    await userEvent.click(screen.getByRole("button", { name: "Create Client" }));
    expect(screen.getByText("Client name is required.")).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText("Client name"), "Unauthorized Client");
    await userEvent.click(screen.getByRole("button", { name: "Create Client" }));
    expect(await screen.findByText("Owner or admin access is required.")).toBeInTheDocument();
  });
});
