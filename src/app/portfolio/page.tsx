"use client";

import { useMemo, useState } from "react";
import {
  AppShell,
  DashboardLoadingState,
  EmptySectionState,
  MiniMetric,
  Section,
  SourcePill,
  StatusPill,
  useOwnerMode,
} from "@/components/AppShell";
import { getCurrencyMeta, type ClientCurrencyCode } from "@/lib/clientTypes";
import { useMultiStoreView, type MultiStoreCard } from "@/lib/useMultiStoreView";

type SortKey =
  | "websiteSales"
  | "adSpend"
  | "roas"
  | "orders"
  | "costPerOrder"
  | "aov"
  | "storeName";

type StatusFilter = "all" | "ready" | "partial" | "blocked";
type CurrencyFilter = "all" | ClientCurrencyCode;

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "websiteSales", label: "Website sales" },
  { value: "adSpend", label: "Ad spend" },
  { value: "roas", label: "ROAS" },
  { value: "orders", label: "Orders" },
  { value: "costPerOrder", label: "Cost per order" },
  { value: "aov", label: "AOV" },
  { value: "storeName", label: "Store name" },
];

export default function PortfolioPage() {
  return (
    <AppShell portfolioMode>
      <PortfolioContent />
    </AppShell>
  );
}

function PortfolioContent() {
  const { ownerMode, setOwnerMode } = useOwnerMode();
  const { cards, summary, isLoading, error, refresh } = useMultiStoreView();
  const [sortBy, setSortBy] = useState<SortKey>("websiteSales");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("all");

  const visibleCards = useMemo(() => {
    const filtered = cards.filter((card) => {
      if (statusFilter !== "all" && card.status !== statusFilter) {
        return false;
      }

      if (currencyFilter !== "all" && card.currencyCode !== currencyFilter) {
        return false;
      }

      return true;
    });

    return filtered.sort((left, right) => compareCards(left, right, sortBy));
  }, [cards, currencyFilter, sortBy, statusFilter]);

  const mixedCurrencies = summary.currencies.length > 1;

  if (!ownerMode) {
    return (
      <Section
        title="Owner access required"
        subtitle="Turn owner mode on to compare store performance across the full portfolio."
      >
        <div className="rounded-[20px] border border-[var(--line)] bg-[rgba(255,255,255,0.58)] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
              This route is ready for multi-store comparison, but it stays behind owner mode so portfolio-level data is only shown in the operator view.
            </p>
            <button
              type="button"
              onClick={() => setOwnerMode(true)}
              className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Turn on owner mode
            </button>
          </div>
        </div>
      </Section>
    );
  }

  if (isLoading) {
    return (
      <DashboardLoadingState
        title="Loading multi-store overview"
        description="Pulling portfolio-level spend, storefront truth, and connection health across all stores."
      />
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Section
          title="Portfolio view unavailable"
          subtitle="The route is in place, but the comparison payload did not load cleanly."
        >
          <div className="rounded-[24px] border border-amber-300 bg-amber-50 p-5 text-amber-950">
            <div className="text-sm font-semibold">{error}</div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
              This usually means one of the source previews failed before the portfolio payload could be assembled.
            </p>
            <button
              type="button"
              onClick={refresh}
              className="mt-4 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Try again
            </button>
          </div>
        </Section>
      ) : null}

      <Section
        title="Portfolio Snapshot"
        subtitle="Use this strip to see how many stores are truly comparison-ready before you trust the rankings below."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <SourcePill label={`${summary.totalStores} stores in scope`} tone="default" />
          <SourcePill label={`${summary.readyStores} ready`} tone="good" />
          <SourcePill
            label={mixedCurrencies ? "Multiple currencies detected" : "Single currency view"}
            tone={mixedCurrencies ? "warn" : "good"}
          />
          <SourcePill label="Metric logic from Admin" tone="default" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MiniMetric
            label="Stores in scope"
            value={String(summary.totalStores)}
            hint={`${visibleCards.length} visible after filters`}
            tone="default"
          />
          <MiniMetric
            label="Ready"
            value={String(summary.readyStores)}
            hint="Store truth and paid media both ready"
            tone="good"
          />
          <MiniMetric
            label="Partial"
            value={String(summary.partialStores)}
            hint="Only one truth layer is connected"
            tone="warn"
          />
          <MiniMetric
            label="Blocked"
            value={String(summary.blockedStores)}
            hint="Neither storefront nor paid media is ready"
            tone="bad"
          />
          <MiniMetric
            label="Currencies"
            value={summary.currencies.length ? summary.currencies.join(" / ") : "Waiting"}
            hint={mixedCurrencies ? "Money rankings span mixed currencies" : "Money metrics are directly comparable"}
            tone={mixedCurrencies ? "warn" : "good"}
          />
        </div>
      </Section>

      <Section
        title="Comparison Controls"
        subtitle="Sort for the question you are asking, then filter to the stores that are fair to compare."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr,1fr,1fr]">
          <label className="text-sm text-[var(--ink)]">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Sort stores by
            </span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortKey)}
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.78)] px-3 py-3 text-sm font-medium text-[var(--ink)] outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-[var(--ink)]">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Filter by readiness
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.78)] px-3 py-3 text-sm font-medium text-[var(--ink)] outline-none"
            >
              <option value="all">All stores</option>
              <option value="ready">Ready only</option>
              <option value="partial">Partial only</option>
              <option value="blocked">Blocked only</option>
            </select>
          </label>

          <label className="text-sm text-[var(--ink)]">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Filter by currency
            </span>
            <select
              value={currencyFilter}
              onChange={(event) => setCurrencyFilter(event.target.value as CurrencyFilter)}
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.78)] px-3 py-3 text-sm font-medium text-[var(--ink)] outline-none"
            >
              <option value="all">All currencies</option>
              {summary.currencies.map((currencyCode) => (
                <option key={currencyCode} value={currencyCode}>
                  {currencyCode}
                </option>
              ))}
            </select>
          </label>
        </div>

        {mixedCurrencies ? (
          <div className="mt-4 rounded-[22px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
            Money-based sorting is still useful for directional scanning, but it is not apples-to-apples across mixed currencies because this codebase does not have an FX normalization layer yet.
          </div>
        ) : null}
      </Section>

      {!visibleCards.length ? (
        <EmptySectionState
          title="No stores match the current filters"
          description="Try widening the readiness or currency filters so the portfolio grid can show the available stores again."
        />
      ) : (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif-display text-2xl font-semibold tracking-tight text-[var(--ink)]">
                Store Comparison
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Ranked by {getSortLabel(sortBy).toLowerCase()} so the primary metrics line up for faster portfolio scanning.
              </p>
            </div>
            <SourcePill label={`${visibleCards.length} stores shown`} tone="default" />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleCards.map((card, index) => (
              <StoreCard
                key={card.clientId}
                card={card}
                rank={sortBy === "storeName" ? null : index + 1}
                sortBy={sortBy}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StoreCard({
  card,
  rank,
  sortBy,
}: {
  card: MultiStoreCard;
  rank: number | null;
  sortBy: SortKey;
}) {
  return (
    <article className="rounded-[26px] border border-[var(--line)] bg-[rgba(255,255,255,0.58)] p-5 shadow-[var(--shadow)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {rank ? (
              <span className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.7)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
                #{rank} by {getSortLabel(sortBy)}
              </span>
            ) : null}
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {getPlatformLabel(card.websitePlatform)}
            </span>
          </div>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)]">
            {card.storeName}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <StatusPill status={getStatusLabel(card.status)} />
          <SourcePill label={card.currencyCode} tone="default" />
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <PrimaryPortfolioMetric
            label="Ad Spend"
            value={formatMoney(card.adSpend, card.currencyCode)}
            hint="Paid-media spend"
          />
          <PrimaryPortfolioMetric
            label="Website Sales"
            value={formatMoney(card.websiteSales, card.currencyCode)}
            hint="Store-truth revenue"
          />
          <PrimaryPortfolioMetric
            label="ROAS"
            value={formatRatio(card.roas)}
            hint="Sales / spend"
            tone={card.roas !== null && card.roas >= 2 ? "good" : "default"}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 rounded-[18px] bg-[rgba(20,34,24,0.035)] px-4 py-3 sm:grid-cols-3">
        <SecondaryPortfolioMetric label="Orders" value={formatWholeNumber(card.orders)} />
        <SecondaryPortfolioMetric
          label="AOV"
          value={formatMoney(card.aov, card.currencyCode, 2)}
        />
        <SecondaryPortfolioMetric
          label="Cost / Order"
          value={formatMoney(card.costPerOrder, card.currencyCode, 2)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SourcePill
          label={card.storeConnected ? "Store truth connected" : "Store truth missing"}
          tone={card.storeConnected ? "good" : "warn"}
        />
        <SourcePill
          label={card.metaConnected ? "Paid media ready" : "Paid media unavailable"}
          tone={card.metaConnected ? "good" : "warn"}
        />
      </div>

      <div className="mt-3 grid gap-2 text-xs leading-5 text-[var(--muted)] md:grid-cols-2">
        <div>
          <span className="font-semibold text-[var(--ink)]">Store source:</span> {card.storeSourceLabel}
        </div>
        <div>
          <span className="font-semibold text-[var(--ink)]">Paid media:</span> {card.metaSourceLabel}
        </div>
      </div>

      {card.issues.length ? (
        <div className="mt-4 rounded-[18px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          <span className="font-semibold">Watch:</span> {card.issues.slice(0, 2).join(" ")}
          {card.issues.length > 2 ? ` +${card.issues.length - 2} more` : ""}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[var(--muted)]">
          Open the store for campaign, funnel, and health details.
        </div>
        <button
          type="button"
          onClick={() => openStoreDashboard(card.clientId)}
          className="shrink-0 rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Open store dashboard
        </button>
      </div>
    </article>
  );
}

function PrimaryPortfolioMetric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "good" | "default";
}) {
  const valueColor = tone === "good" ? "text-emerald-800" : "text-[var(--ink)]";

  return (
    <div className="min-w-0">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </div>
      <div className={`mt-2 text-[26px] font-semibold leading-none tracking-tight ${valueColor}`}>
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{hint}</div>
    </div>
  );
}

function SecondaryPortfolioMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-[var(--ink)]">{value}</div>
    </div>
  );
}

function compareCards(left: MultiStoreCard, right: MultiStoreCard, sortBy: SortKey) {
  if (sortBy === "storeName") {
    return left.storeName.localeCompare(right.storeName);
  }

  const leftValue = getSortableValue(left, sortBy);
  const rightValue = getSortableValue(right, sortBy);

  if (leftValue === null && rightValue === null) {
    return left.storeName.localeCompare(right.storeName);
  }

  if (leftValue === null) {
    return 1;
  }

  if (rightValue === null) {
    return -1;
  }

  if (rightValue === leftValue) {
    return left.storeName.localeCompare(right.storeName);
  }

  return rightValue - leftValue;
}

function getSortableValue(card: MultiStoreCard, sortBy: Exclude<SortKey, "storeName">) {
  if (sortBy === "websiteSales") {
    return card.websiteSales;
  }

  if (sortBy === "adSpend") {
    return card.adSpend;
  }

  if (sortBy === "roas") {
    return card.roas;
  }

  if (sortBy === "orders") {
    return card.orders;
  }

  if (sortBy === "costPerOrder") {
    return card.costPerOrder;
  }

  return card.aov;
}

function getSortLabel(sortBy: SortKey) {
  return SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? "Website sales";
}

function getPlatformLabel(platform: MultiStoreCard["websitePlatform"]) {
  if (platform === "shopify") {
    return "Shopify";
  }

  if (platform === "wordpress") {
    return "WordPress / WooCommerce";
  }

  if (platform === "salla") {
    return "Salla";
  }

  if (platform === "wix") {
    return "Wix";
  }

  return "Custom website";
}

function getStatusLabel(status: MultiStoreCard["status"]) {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "partial") {
    return "Partial";
  }

  return "Blocked";
}

function formatMoney(
  value: number | null,
  currencyCode: ClientCurrencyCode,
  minimumFractionDigits = 0
) {
  if (value === null) {
    return "Waiting";
  }

  const { locale } = getCurrencyMeta(currencyCode);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(value);
}

function formatRatio(value: number | null) {
  if (value === null) {
    return "Waiting";
  }

  return `${formatNumber(value, 2)}x`;
}

function formatWholeNumber(value: number | null) {
  if (value === null) {
    return "Waiting";
  }

  return formatNumber(value, 0);
}

function formatNumber(value: number, digits: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function openStoreDashboard(clientId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("media-dashboard-active-client", clientId);
  window.location.href = "/";
}
