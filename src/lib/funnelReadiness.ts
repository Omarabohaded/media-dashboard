import type {
  DashboardMetaPreview,
  DashboardStorePreview,
} from "./useDashboardReadiness";

export type FunnelMetricState = "ready" | "partial" | "blocked";

export type FunnelMetricReadiness = {
  id: string;
  label: string;
  state: FunnelMetricState;
  value: string;
  source: string;
  hint: string;
};

type FunnelInputs = {
  storePreview: DashboardStorePreview | null;
  metaPreview: DashboardMetaPreview | null;
  analyticsConnected?: boolean;
};

function formatPercent(value: number, digits = 1) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)}%`;
}

function formatMoney(value: number, currencyCode: string, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function getFunnelReadiness({
  storePreview,
  metaPreview,
  analyticsConnected = false,
}: FunnelInputs): FunnelMetricReadiness[] {
  const addToCart =
    metaPreview?.rows.reduce((sum, row) => sum + (row.addToCart ?? 0), 0) ?? 0;
  const checkoutStarted =
    metaPreview?.rows.reduce(
      (sum, row) => sum + (row.checkoutInitiated ?? 0),
      0
    ) ?? 0;
  const purchases = metaPreview?.totals.purchases ?? 0;
  const clicks = metaPreview?.totals.clicks ?? 0;
  const storeRevenue = storePreview?.grossSales ?? 0;
  const storeCurrency = storePreview?.currencyCode ?? "USD";

  const hasMetaProxy = Boolean(metaPreview);

  return [
    {
      id: "sessions",
      label: "Sessions",
      state: analyticsConnected ? "ready" : "blocked",
      value: analyticsConnected ? "Live analytics" : "Blocked",
      source: analyticsConnected ? "Website analytics truth" : "GA4 / storefront analytics",
      hint:
        "The workbook treats sessions as website truth. They should not be guessed from ad clicks.",
    },
    {
      id: "landing_page_views",
      label: "Landing Page Views",
      state: analyticsConnected ? "ready" : "blocked",
      value: analyticsConnected ? "Live analytics" : "Blocked",
      source: analyticsConnected ? "Website analytics truth" : "GA4 / LPV-capable source",
      hint:
        "LPV rate needs a true landing-view event source, not only platform clicks.",
    },
    {
      id: "atc_rate",
      label: "ATC Rate",
      state: hasMetaProxy ? "partial" : "blocked",
      value:
        hasMetaProxy && clicks > 0
          ? formatPercent((addToCart / clicks) * 100)
          : "Blocked",
      source: hasMetaProxy ? "Platform proxy" : "Website / Shopify / GA4",
      hint:
        hasMetaProxy
          ? "This is a paid-media proxy using Meta click and ATC events. The workbook still prefers website analytics truth."
          : "Needs add-to-cart and session truth before this metric is usable.",
    },
    {
      id: "checkout_start_rate",
      label: "Checkout Start Rate",
      state: hasMetaProxy ? "partial" : "blocked",
      value:
        hasMetaProxy && clicks > 0
          ? formatPercent((checkoutStarted / clicks) * 100)
          : "Blocked",
      source: hasMetaProxy ? "Platform proxy" : "Website / Shopify / GA4",
      hint:
        hasMetaProxy
          ? "This is directionally useful, but still not website-truth quality."
          : "Needs begin_checkout and session truth from the website layer.",
    },
    {
      id: "checkout_completion_rate",
      label: "Checkout Completion Rate",
      state: hasMetaProxy && checkoutStarted > 0 ? "partial" : "blocked",
      value:
        hasMetaProxy && checkoutStarted > 0
          ? formatPercent((purchases / checkoutStarted) * 100)
          : "Blocked",
      source:
        hasMetaProxy && checkoutStarted > 0
          ? "Platform proxy"
          : "Website / Shopify / GA4",
      hint:
        hasMetaProxy && checkoutStarted > 0
          ? "Useful as an early warning, but still needs site analytics or checkout truth for final confidence."
          : "Needs checkout-start and purchase truth before it can be evaluated.",
    },
    {
      id: "purchase_cvr",
      label: "Purchase CVR",
      state: hasMetaProxy ? "partial" : "blocked",
      value:
        hasMetaProxy && clicks > 0
          ? formatPercent((purchases / clicks) * 100)
          : "Blocked",
      source: hasMetaProxy ? "Platform proxy" : "Website / GA4",
      hint:
        hasMetaProxy
          ? "This is click-to-purchase from platform data. The workbook prefers session-to-purchase truth from site analytics."
          : "Needs sessions and purchases from the website analytics layer.",
    },
    {
      id: "revenue_per_session",
      label: "Revenue per Session",
      state: analyticsConnected ? "ready" : "blocked",
      value:
        analyticsConnected && storeRevenue > 0
          ? `${formatMoney(storeRevenue, storeCurrency)} / sessions`
          : "Blocked",
      source: analyticsConnected ? "Website truth" : "Website revenue + analytics sessions",
      hint:
        "The workbook only trusts this once store revenue and website sessions both exist in the same truth layer.",
    },
  ];
}
