import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  ownerMode: true,
  view: {} as Record<string, unknown>,
  setOwnerMode: vi.fn(),
}));

vi.mock("@/lib/useMultiStoreView", () => ({ useMultiStoreView: () => state.view }));
vi.mock("@/components/AppShell", async () => {
  const React = await import("react");
  return {
    AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
    useOwnerMode: () => ({ ownerMode: state.ownerMode, setOwnerMode: state.setOwnerMode }),
    DashboardLoadingState: ({ title }: { title: string }) => <h1>{title}</h1>,
    EmptySectionState: ({ title, description }: { title: string; description: string }) => <div><h2>{title}</h2><p>{description}</p></div>,
    MiniMetric: ({ label, value, hint }: { label: string; value: string; hint: string }) => <div aria-label={label}>{value}<small>{hint}</small></div>,
    Section: ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => <section><h2>{title}</h2><p>{subtitle}</p>{children}</section>,
    SourcePill: ({ label }: { label: string }) => <span>{label}</span>,
    StatusPill: ({ status }: { status: string }) => <span>{status}</span>,
  };
});

import PortfolioPage from "@/app/portfolio/page";

const summary = {
  totalStores: 0,
  readyStores: 0,
  partialStores: 0,
  blockedStores: 0,
  currencies: [] as string[],
};
const card = {
  clientId: "client-aed",
  storeName: "AED Store",
  websitePlatform: "shopify",
  currencyCode: "AED",
  status: "ready",
  adSpend: 100,
  websiteSales: 500,
  roas: 5,
  orders: 10,
  aov: 50,
  costPerOrder: 10,
  storeConnected: true,
  metaConnected: true,
  storeSourceLabel: "Shopify",
  metaSourceLabel: "Meta + Google",
  issues: [] as string[],
};

describe("Portfolio rendered states", () => {
  beforeEach(() => {
    state.ownerMode = true;
    state.setOwnerMode.mockReset();
    state.view = { cards: [], summary, isLoading: false, error: null, refresh: vi.fn() };
  });

  it("renders unauthorized owner mode and its action", async () => {
    state.ownerMode = false;
    render(<PortfolioPage />);
    expect(screen.getByText("Owner access required")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Turn on owner mode" }));
    expect(state.setOwnerMode).toHaveBeenCalledWith(true);
  });

  it("renders loading and empty states", () => {
    state.view = { cards: [], summary, isLoading: true, error: null, refresh: vi.fn() };
    const { rerender } = render(<PortfolioPage />);
    expect(screen.getByText("Loading multi-store overview")).toBeInTheDocument();
    state.view = { cards: [], summary, isLoading: false, error: null, refresh: vi.fn() };
    rerender(<PortfolioPage />);
    expect(screen.getByText("No stores match the current filters")).toBeInTheDocument();
  });

  it("renders a failed portfolio and retry action", async () => {
    const refresh = vi.fn();
    state.view = { cards: [], summary, isLoading: false, error: "Portfolio API unavailable", refresh };
    render(<PortfolioPage />);
    expect(screen.getByText("Portfolio view unavailable")).toBeInTheDocument();
    expect(screen.getByText("Portfolio API unavailable")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalled();
  });

  it("renders healthy, partial, blocked, unavailable-platform, and no-double-count summary evidence", () => {
    const cards = [
      card,
      { ...card, clientId: "client-usd", storeName: "USD Store", currencyCode: "USD", status: "partial", metaConnected: false, adSpend: null, issues: ["Google Ads unavailable."] },
      { ...card, clientId: "client-blocked", storeName: "Blocked Store", currencyCode: "AED", status: "blocked", storeConnected: false, metaConnected: false, adSpend: null, websiteSales: null, roas: null, orders: null, aov: null, costPerOrder: null, issues: ["Missing account.", "Missing mapping."] },
    ];
    state.view = {
      cards,
      summary: { totalStores: 3, readyStores: 1, partialStores: 1, blockedStores: 1, currencies: ["AED", "USD"] },
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    };
    render(<PortfolioPage />);
    expect(screen.getByText("Multiple currencies detected")).toBeInTheDocument();
    expect(screen.getByText(/does not have an FX normalization layer/)).toBeInTheDocument();
    expect(screen.getByLabelText("Stores in scope")).toHaveTextContent("3");
    expect(screen.getByLabelText("Ready")).toHaveTextContent("1");
    expect(screen.getByLabelText("Partial")).toHaveTextContent("1");
    expect(screen.getByLabelText("Blocked")).toHaveTextContent("1");
    expect(screen.getByLabelText("Currencies")).toHaveTextContent("AED / USD");
    expect(screen.getByText("Google Ads unavailable.")).toBeInTheDocument();
    expect(screen.getByText(/Missing account. Missing mapping./)).toBeInTheDocument();
    expect(screen.getAllByText("Paid media unavailable")).toHaveLength(2);
  });
});
