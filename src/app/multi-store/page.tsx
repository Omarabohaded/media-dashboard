"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppShell,
  DashboardLoadingState,
  EmptySectionState,
  PageLead,
  Section,
  SourcePill,
  StatusPill,
  useDashboardDate,
} from "@/components/AppShell";

type MultiStoreCard = {
  clientId: string;
  storeName: string;
  websitePlatform: string;
  currencyCode: string;
  adSpend: number | null;
  websiteSales: number | null;
  roas: number | null;
  orders: number | null;
  aov: number | null;
  costPerOrder: number | null;
  status: "ready" | "partial" | "blocked";
  storeConnected: boolean;
  metaConnected: boolean;
  storeSourceLabel: string;
  metaSourceLabel: string;
  issues: string[];
};

type MultiStoreResponse = {
  cards: MultiStoreCard[];
  summary: {
    totalStores: number;
    readyStores: number;
    partialStores: number;
    blockedStores: number;
    currencies: string[];
  };
  error?: string;
};

type SortKey = "sales" | "spend" | "roas" | "orders" | "cost_per_order" | "aov";
type FilterKey = "all" | "ready" | "partial" | "blocked";

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "sales", label: "Website sales" },
  { value: "spend", label: "Ad spend" },
  { value: "roas", label: "ROAS" },
  { value: "orders", label: "Orders" },
  { value: "cost_per_order", label: "Cost per order" },
  { value: "aov", label: "AOV" },
];

function formatMoney(value: number | null, currencyCode: string) {
  if (value === null) {
    return "Waiting";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null, digits = 0) {
  if (value === null) {
    return "Waiting";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export default function MultiStorePage() {
  return (
    <AppShell>
      <MultiStoreViewContent />
    </AppShell>
  );
}

function MultiStoreViewContent() {
  const { metaPreviewQuery, activeSummary } = useDashboardDate();
  const [payload, setPayload] = useState<MultiStoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("roas");
  const [filterKey, setFilterKey] = useState<FilterKey>("all");

  useEffect(() => {
    async function loadPortfolio() {
      setIsLoading(true);
      setMessage(null);

      try {
        const response = await fetch(`/api/dashboard/multi-store-view?${metaPreviewQuery}`, {
          cache: "no-store",
        });
        const nextPayload = (await response.json()) as MultiStoreResponse;

        if (!response.ok) {
          throw new Error(nextPayload.error ?? "Could not load the multi-store view.");
        }

        setPayload(nextPayload);
      } catch (error) {
        setPayload(null);
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load the multi-store view."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadPortfolio();
  }, [metaPreviewQuery]);

  const cards = payload?.cards ?? [];
  const filteredCards = useMemo(() => {
    const base =
      filterKey === "all"
        ? cards
        : cards.filter((card) => card.status === filterKey);

    return [...base].sort((left, right) => {
      const leftValue = getSortableValue(left, sortKey);
      const rightValue = getSortableValue(right, sortKey);
      return rightValue - leftValue;
    });
  }, [cards, filterKey, sortKey]);

  const hasMixedCurrencies = (payload?.summary.currencies.length ?? 0) > 1;

  if (isLoading) {
    return (
      <DashboardLoadingState
        title="Loading multi-store comparison"
        description="Pulling store-truth and paid-media summaries across the client portfolio."
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageLead
        eyebrow="Multi Store View"
        title="Portfolio comparison across stores"
        summary="Use this page to compare store-level spend, sales, ROAS, orders, AOV, and cost per order without jumping between client dashboards. The reporting window in the header controls every store card on this page."
      />

      <div className="flex flex-wrap gap-2">
        <SourcePill
          label={`${payload?.summary.totalStores ?? 0} stores`}
          tone="good"
        />
        <SourcePill
          label={`${payload?.summary.readyStores ?? 0} ready`}
          tone="good"
        />
        <SourcePill
          label={`${payload?.summary.partialStores ?? 0} partial`}
          tone="warn"
        />
        <SourcePill
          label={`${payload?.summary.blockedStores ?? 0} blocked`}
          tone="bad"
        />
        <SourcePill
          label={`Reporting window: ${activeSummary}`}
          tone="default"
        />
        {hasMixedCurrencies ? (
          <SourcePill label="Mixed currencies" tone="warn" />
        ) : null}
      </div>

      {message ? (
        <EmptySectionState
          title="The portfolio view could not be loaded"
          description={message}
          bullets={[
            "Check that at least one client exists in Admin.",
            "Confirm Meta or store-truth connections for the stores you expect to compare.",
          ]}
        />
      ) : null}

      {!message && cards.length === 0 ? (
        <EmptySectionState
          title="No stores are available yet"
          description="Create and connect clients in Admin first, then this page will compare them here using the shared reporting window."
          bullets={[
            "Add clients in Admin.",
            "Connect store truth where available.",
            "Connect Meta per client so ad spend can be compared next to website sales.",
          ]}
        />
      ) : null}

      {!message && cards.length > 0 ? (
        <Section
          title="Store Comparison"
          subtitle="Each card uses the same metric logic as the client dashboards, so the comparison stays aligned with your existing reporting rules."
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["all", "ready", "partial", "blocked"] as FilterKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilterKey(key)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    filterKey === key
                      ? "border-[var(--accent)] bg-[rgba(161,66,26,0.12)] text-[var(--accent)]"
                      : "border-[var(--line)] bg-[rgba(255,255,255,0.72)] text-[var(--ink)]"
                  }`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm text-[var(--ink)]">
              <span className="font-semibold">Sort by</span>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="bg-transparent outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {hasMixedCurrencies ? (
            <div className="mt-4 rounded-[20px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              This portfolio contains mixed currencies. ROAS and orders are fully comparable, but spend, sales, AOV, and cost per order are still shown in each store’s native currency.
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCards.map((card) => (
              <StoreCard key={card.clientId} card={card} />
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function StoreCard({ card }: { card: MultiStoreCard }) {
  function openStoreDashboard() {
    window.localStorage.setItem("media-dashboard-active-client", card.clientId);
    window.location.href = "/";
  }

  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.58)] p-5 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-[var(--ink)]">{card.storeName}</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            {card.websitePlatform} store
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <SourcePill
              label={card.storeConnected ? "Store truth connected" : "Store truth blocked"}
              tone={card.storeConnected ? "good" : "warn"}
            />
            <SourcePill
              label={card.metaConnected ? "Paid media connected" : "Paid media blocked"}
              tone={card.metaConnected ? "good" : "warn"}
            />
          </div>
        </div>
        <StatusPill
          status={
            card.status === "ready"
              ? "Ready"
              : card.status === "partial"
              ? "Partial"
              : "Blocked"
          }
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCell
          label="Ad Spend"
          value={formatMoney(card.adSpend, card.currencyCode)}
        />
        <MetricCell
          label="Website Sales"
          value={formatMoney(card.websiteSales, card.currencyCode)}
        />
        <MetricCell
          label="ROAS"
          value={card.roas !== null ? `${formatNumber(card.roas, 2)}x` : "Waiting"}
        />
        <MetricCell
          label="Orders"
          value={formatNumber(card.orders)}
        />
        <MetricCell
          label="AOV"
          value={formatMoney(card.aov, card.currencyCode)}
        />
        <MetricCell
          label="Cost Per Order"
          value={formatMoney(card.costPerOrder, card.currencyCode)}
        />
      </div>

      <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
        <div>Store source: {card.storeSourceLabel}</div>
        <div>Paid media source: {card.metaSourceLabel}</div>
      </div>

      {card.issues.length ? (
        <div className="mt-4 rounded-[20px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {card.issues[0]}
        </div>
      ) : null}

      <div className="mt-4">
        <button
          type="button"
          onClick={openStoreDashboard}
          className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Open Store Dashboard
        </button>
      </div>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-2 text-base font-semibold text-[var(--ink)]">{value}</div>
    </div>
  );
}

function getSortableValue(card: MultiStoreCard, sortKey: SortKey) {
  if (sortKey === "sales") {
    return card.websiteSales ?? -1;
  }
  if (sortKey === "spend") {
    return card.adSpend ?? -1;
  }
  if (sortKey === "roas") {
    return card.roas ?? -1;
  }
  if (sortKey === "orders") {
    return card.orders ?? -1;
  }
  if (sortKey === "cost_per_order") {
    return card.costPerOrder ?? -1;
  }
  return card.aov ?? -1;
}
