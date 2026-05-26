"use client";

import {
  AppShell,
  EmptySectionState,
  MiniMetric,
  Section,
  SourcePill,
} from "@/components/AppShell";
import { getCurrencyMeta } from "@/lib/clientTypes";
import { useDashboardReadiness } from "@/lib/useDashboardReadiness";

function formatMoney(value: number, currencyCode: string) {
  const locale =
    getCurrencyMeta((["USD", "AED", "SAR", "EGP"].includes(currencyCode)
      ? currencyCode
      : "USD") as "USD" | "AED" | "SAR" | "EGP").locale;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export default function HealthPage() {
  const { activeClient, metaPreview, metaStatus, storePreview, storeStatus, message } =
    useDashboardReadiness();

  const storeCurrency = storePreview?.currencyCode ?? activeClient?.currencyCode ?? "USD";
  const totalSpend = metaPreview?.totals.spend ?? 0;
  const storeRevenue = storePreview?.grossSales ?? 0;
  const orders = storePreview?.ordersCount ?? 0;
  const mer = totalSpend > 0 ? storeRevenue / totalSpend : 0;
  const blendedRoas =
    totalSpend > 0 && metaPreview ? metaPreview.totals.purchaseValue / totalSpend : 0;
  const aov = orders > 0 ? storeRevenue / orders : 0;

  const hasBusinessTruth = Boolean(storePreview);
  const hasMetaSpend = Boolean(metaPreview && metaStatus?.selectedAccountId);

  return (
    <AppShell>
      <div className="space-y-5">
        <Section
          title="Business Health"
          subtitle="This page follows the metric workbook: store truth for revenue and orders, platform data for spend, and blended/custom metrics only when both sources exist."
        >
          <div className="mb-4 flex flex-wrap gap-2">
            <SourcePill
              label={hasBusinessTruth ? "Store truth connected" : "Store truth missing"}
              tone={hasBusinessTruth ? "good" : "warn"}
            />
            <SourcePill
              label={hasMetaSpend ? "Meta spend connected" : "Meta spend missing"}
              tone={hasMetaSpend ? "good" : "warn"}
            />
            <SourcePill
              label="Sessions still need GA4 or storefront analytics"
              tone="default"
            />
          </div>

          {!hasBusinessTruth ? (
            <EmptySectionState
              title="Business-truth metrics are waiting for the website source"
              description="The workbook says revenue, orders, AOV, and MER should come from the website truth layer, not from platform reporting alone. This page now stays honest until Shopify or WordPress/WooCommerce is connected for the selected client."
              bullets={[
                `Active client: ${activeClient?.name ?? "No client selected"}`,
                `Expected store source: ${activeClient?.websitePlatform ?? "unknown"}`,
                storeStatus?.recommendedNextStep ??
                  "Connect the client's website source in Admin first.",
                "Sessions, LPV rate, ATC rate, checkout rate, and purchase CVR will need store analytics or GA4 after store truth is connected.",
              ]}
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MiniMetric
                label="Store Revenue"
                value={formatMoney(storeRevenue, storeCurrency)}
                hint={`Website truth from ${storePreview?.storeName ?? storeStatus?.sourceLabel ?? "store source"}`}
                tone="good"
              />
              <MiniMetric
                label="Orders"
                value={formatNumber(orders)}
                hint="Website/store truth"
                tone="good"
              />
              <MiniMetric
                label="AOV"
                value={formatMoney(aov, storeCurrency)}
                hint="Revenue divided by orders"
                tone="good"
              />
              <MiniMetric
                label="Store Revenue Source"
                value={storeStatus?.sourceLabel ?? "Store source"}
                hint={storePreview?.note ?? "Business truth preview"}
                tone="default"
              />
              <MiniMetric
                label="Ad Spend"
                value={
                  hasMetaSpend
                    ? formatMoney(totalSpend, metaStatus?.selectedAccount?.currency ?? "USD")
                    : "Waiting for Meta"
                }
                hint="Platform spend layer"
                tone={hasMetaSpend ? "good" : "warn"}
              />
              <MiniMetric
                label="MER"
                value={hasMetaSpend ? `${formatNumber(mer, 2)}x` : "Needs spend source"}
                hint="Store revenue divided by total ad spend"
                tone={hasMetaSpend ? (mer >= 2 ? "good" : "warn") : "warn"}
              />
              <MiniMetric
                label="Blended ROAS"
                value={
                  hasMetaSpend ? `${formatNumber(blendedRoas, 2)}x` : "Needs spend source"
                }
                hint="Platform-attributed revenue divided by total ad spend"
                tone={hasMetaSpend ? "good" : "warn"}
              />
              <MiniMetric
                label="Purchase CVR"
                value="Needs sessions"
                hint="Workbook source is website analytics, not ad platform only"
                tone="warn"
              />
            </div>
          )}
        </Section>

        <Section
          title="Health Interpretation"
          subtitle="These reads now follow the workbook source mapping instead of demo numbers."
        >
          <div className="grid gap-5 md:grid-cols-3">
            <MiniMetric
              label="Main Read"
              value={
                hasBusinessTruth && hasMetaSpend
                  ? mer >= 2
                    ? "Business truth is readable"
                    : "Business truth says protect efficiency"
                  : "Business truth not fully ready"
              }
              hint={
                hasBusinessTruth && hasMetaSpend
                  ? "Store revenue and Meta spend are both available."
                  : "This page will become decision-ready after both website truth and spend are connected."
              }
              tone={hasBusinessTruth && hasMetaSpend ? "good" : "warn"}
            />
            <MiniMetric
              label="Missing Layer"
              value={
                !hasBusinessTruth
                  ? "Store truth"
                  : !hasMetaSpend
                  ? "Spend source"
                  : "Sessions / funnel analytics"
              }
              hint="This is the next source needed to complete workbook logic."
              tone="warn"
            />
            <MiniMetric
              label="Next Check"
              value={storeStatus?.sourceLabel ?? "Admin setup"}
              hint={message ?? storeStatus?.recommendedNextStep ?? "No issues detected."}
              tone="default"
            />
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
