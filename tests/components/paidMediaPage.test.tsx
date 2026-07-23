import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ readiness: {} as Record<string, unknown> }));

vi.mock("@/lib/useDashboardReadiness", () => ({
  useDashboardReadiness: () => state.readiness,
}));
vi.mock("@/lib/dashboardMetricLogic", () => ({
  getEffectiveCpaCac: vi.fn(() => ({ value: null, appliedDenominator: "store_orders", blockedReason: "Store orders unavailable" })),
  getCpaDenominatorLabel: vi.fn(() => "store orders"),
}));
vi.mock("@/components/AppShell", async () => {
  const React = await import("react");
  return {
    AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
    DashboardLoadingState: ({ title, description }: { title: string; description: string }) => <div><h1>{title}</h1><p>{description}</p></div>,
    EmptySectionState: ({ title, description, bullets }: { title: string; description: string; bullets: string[] }) => <section><h2>{title}</h2><p>{description}</p>{bullets.map((item) => <span key={item}>{item}</span>)}</section>,
    MiniMetric: ({ label, value, hint }: { label: string; value: string; hint: string }) => <div aria-label={label}><b>{label}</b><span>{value}</span><small>{hint}</small></div>,
    PageLead: ({ title, summary }: { title: string; summary: string }) => <header><h1>{title}</h1><p>{summary}</p></header>,
    Section: ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => <section><h2>{title}</h2><p>{subtitle}</p>{children}</section>,
    SourcePill: ({ label }: { label: string }) => <span>{label}</span>,
    StatusPill: ({ status }: { status: string }) => <span>{status}</span>,
  };
});

import PaidMediaPage from "@/app/paid-media/page";

const base = {
  activeClient: { id: "client-visible", name: "Visible Client", currencyCode: "AED" },
  isLoading: false,
  metaPreview: null,
  metaStatus: null,
  storePreview: null,
  metricLogic: {},
  paidMediaReport: null,
};

describe("Paid Media rendered states", () => {
  beforeEach(() => {
    state.readiness = { ...base };
  });

  it("renders a user-visible loading state", () => {
    state.readiness = { ...base, isLoading: true };
    render(<PaidMediaPage />);
    expect(screen.getByRole("heading", { name: "Loading paid media analysis" })).toBeInTheDocument();
  });

  it("renders empty/disconnected and missing account guidance", () => {
    render(<PaidMediaPage />);
    expect(screen.getByText("No paid-media source is connected yet")).toBeInTheDocument();
    expect(screen.getByText("Meta missing")).toBeInTheDocument();
    expect(screen.getByText("Google Ads awaiting connection")).toBeInTheDocument();
    expect(screen.getByText("Snapchat awaiting connection")).toBeInTheDocument();
    expect(screen.getByText(/Connect Meta in Admin and save the correct ad account/)).toBeInTheDocument();
  });

  it("renders connected four-platform data, correct client currency, and campaign rows", () => {
    state.readiness = {
      ...base,
      metaPreview: { totals: { spend: 100 } },
      metaStatus: { selectedAccountId: "m-1" },
      paidMediaReport: {
        rows: [
          { sourceType: "meta", sourceRecordId: "m1", sourceRecordName: "Meta Campaign", spend: 100, purchases: 5, purchaseValue: 500, ctr: 2, cpc: 1, roas: 5 },
          { sourceType: "google", sourceRecordId: "g1", sourceRecordName: "Search Campaign", spend: 50, purchases: 2, purchaseValue: 200, ctr: 3, cpc: 2, roas: 4 },
        ],
        channels: [
          { sourceType: "meta", spend: 100, roas: 5, mappingStatuses: ["mapped"] },
          { sourceType: "tiktok", spend: 20, roas: 3, mappingStatuses: ["mapped"] },
          { sourceType: "google", spend: 50, roas: 4, mappingStatuses: ["mapped"] },
          { sourceType: "snap", spend: 10, roas: 2, mappingStatuses: ["mapped"] },
        ],
        issues: [],
        blended: { spend: 180, purchaseValue: 780, ctr: 2.5, cpc: 1.2, cpm: 8, roas: 4.33 },
      },
    };
    render(<PaidMediaPage />);
    expect(screen.getByText("Meta live")).toBeInTheDocument();
    expect(screen.getByText("TikTok included")).toBeInTheDocument();
    expect(screen.getByText("Google Ads included")).toBeInTheDocument();
    expect(screen.getByText("Snapchat included")).toBeInTheDocument();
    expect(screen.getByLabelText("Spend")).toHaveTextContent("AED");
    expect(screen.getByText("Meta Campaign")).toBeInTheDocument();
    expect(screen.getByText("Search Campaign")).toBeInTheDocument();
  });

  it("renders partial data, missing mapping, failed sync, and platform unavailable messages", () => {
    state.readiness = {
      ...base,
      paidMediaReport: {
        rows: [{ sourceType: "meta", sourceRecordId: "m1", sourceRecordName: "Available Campaign", spend: 10, purchases: 0, purchaseValue: 0, ctr: null, cpc: null, roas: null }],
        channels: [{ sourceType: "meta", spend: 10, roas: null, mappingStatuses: ["missing_mapping"] }],
        issues: [
          { sourceType: "tiktok", message: "Purchase conversion mapping is missing." },
          { sourceType: "google", message: "Last sync failed: refresh failed." },
          { sourceType: "snap", message: "Platform unavailable." },
        ],
        blended: { spend: 10, purchaseValue: 0, ctr: null, cpc: null, cpm: null, roas: null },
      },
    };
    render(<PaidMediaPage />);
    expect(screen.getByText("Purchase conversion mapping is missing.")).toBeInTheDocument();
    expect(screen.getByText("Last sync failed: refresh failed.")).toBeInTheDocument();
    expect(screen.getByText("Platform unavailable.")).toBeInTheDocument();
    expect(screen.getByText(/Mapping: missing_mapping/)).toBeInTheDocument();
  });
});
