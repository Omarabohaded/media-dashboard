"use client";

import {
  AppShell,
  DashboardLoadingState,
  EmptySectionState,
  MiniMetric,
  PageLead,
  Section,
  SourcePill,
  StatusPill,
} from "@/components/AppShell";
import { getFunnelReadiness } from "@/lib/funnelReadiness";
import { useDashboardReadiness } from "@/lib/useDashboardReadiness";

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatPercent(value: number, digits = 1) {
  return `${formatNumber(value, digits)}%`;
}

export default function FunnelPage() {
  const { activeClient, isLoading, metaPreview, storePreview } = useDashboardReadiness();

  const readiness = getFunnelReadiness({
    storePreview,
    metaPreview,
    analyticsConnected: false,
  });

  const hasMetaProxy = Boolean(metaPreview);
  const addToCart = metaPreview?.rows.reduce((sum, row) => sum + (row.addToCart ?? 0), 0) ?? 0;
  const checkoutStarted =
    metaPreview?.rows.reduce((sum, row) => sum + (row.checkoutInitiated ?? 0), 0) ?? 0;
  const purchases = metaPreview?.totals.purchases ?? 0;
  const clicks = metaPreview?.totals.clicks ?? 0;
  const atcRate = clicks > 0 ? (addToCart / clicks) * 100 : null;
  const checkoutStartRate = clicks > 0 ? (checkoutStarted / clicks) * 100 : null;
  const checkoutCompletionRate = checkoutStarted > 0 ? (purchases / checkoutStarted) * 100 : null;
  const purchaseProxyCvr = clicks > 0 ? (purchases / clicks) * 100 : null;

  const primaryRead = !hasMetaProxy
    ? "The funnel page is set up, but it cannot analyze anything until at least one media source is connected."
    : checkoutCompletionRate !== null && checkoutCompletionRate < 35
    ? "The weakness is deeper in the funnel. Ads may still be creating intent, but checkout completion is too soft to trust scaling."
    : atcRate !== null && atcRate < 6
    ? "The weakness appears earlier. Traffic is arriving, but product interest is not converting into enough add-to-cart behavior."
    : "This funnel view has a useful paid-media proxy, but it still needs site analytics before the step rates become final business truth.";

  if (isLoading) {
    return (
      <AppShell>
        <DashboardLoadingState
          title="Loading funnel analysis"
          description="Checking which funnel layers are fully trusted, partially available, or still blocked."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageLead
          eyebrow="Funnel"
          title={activeClient ? `${activeClient.name} funnel analysis` : "Funnel analysis"}
          summary={primaryRead}
        />

        <div className="flex flex-wrap gap-2">
          <SourcePill
            label={storePreview ? "Store truth connected" : "Store truth missing"}
            tone={storePreview ? "good" : "warn"}
          />
          <SourcePill
            label={hasMetaProxy ? "Platform funnel proxy available" : "No platform funnel proxy yet"}
            tone={hasMetaProxy ? "default" : "warn"}
          />
          <SourcePill label="Site analytics truth still blocked" tone="warn" />
        </div>

        {!hasMetaProxy ? (
          <EmptySectionState
            title="No funnel data is available yet"
            description="This tab is now its own analysis page, but it will stay empty until the client has at least one connected paid-media source or analytics layer."
            bullets={[
              `Active client: ${activeClient?.name ?? "No client selected"}`,
              "Connect Meta in Admin to unlock directional funnel proxy metrics.",
              "Connect GA4 or a storefront analytics layer later to unlock true session-based funnel analysis.",
            ]}
          />
        ) : null}

        <Section
          title="Step Readiness"
          subtitle="Each funnel metric now owns its own state instead of pretending the homepage summary is enough."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {readiness.map((metric) => (
              <MiniMetric
                key={metric.id}
                label={metric.label}
                value={metric.value}
                hint={`${metric.source} · ${metric.hint}`}
                tone={
                  metric.state === "ready"
                    ? "good"
                    : metric.state === "partial"
                    ? "default"
                    : "warn"
                }
              />
            ))}
          </div>
        </Section>

        <Section
          title="Current Funnel Proxy"
          subtitle="These numbers are useful for diagnosis, but they are still platform-side proxies until analytics truth is connected."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MiniMetric
              label="Clicks"
              value={hasMetaProxy ? formatNumber(clicks) : "Waiting"}
              hint="Top-of-funnel paid traffic proxy"
              tone={hasMetaProxy ? "good" : "warn"}
            />
            <MiniMetric
              label="Add To Cart"
              value={hasMetaProxy ? formatNumber(addToCart) : "Waiting"}
              hint="Platform event proxy"
              tone={hasMetaProxy ? "good" : "warn"}
            />
            <MiniMetric
              label="Checkout Started"
              value={hasMetaProxy ? formatNumber(checkoutStarted) : "Waiting"}
              hint="Platform event proxy"
              tone={hasMetaProxy ? "good" : "warn"}
            />
            <MiniMetric
              label="Purchases"
              value={hasMetaProxy ? formatNumber(purchases) : "Waiting"}
              hint="Platform-attributed purchases"
              tone={hasMetaProxy ? "good" : "warn"}
            />
            <MiniMetric
              label="Proxy Purchase CVR"
              value={purchaseProxyCvr !== null ? formatPercent(purchaseProxyCvr) : "Waiting"}
              hint="Purchases divided by clicks"
              tone={purchaseProxyCvr !== null ? "default" : "warn"}
            />
          </div>
        </Section>

        <div className="grid gap-5 xl:grid-cols-2">
          <Section
            title="Where It Looks Weak"
            subtitle="Use this to decide whether the issue is traffic quality, product interest, or checkout friction."
          >
            <div className="space-y-4">
              <FindingCard
                title="Add-to-cart quality"
                status={atcRate !== null && atcRate < 6 ? "Watch" : "Stable"}
                detail={
                  atcRate !== null
                    ? `Current proxy ATC rate is ${formatPercent(atcRate)}. Low ATC usually points to weak landing-page relevance, weak offer, or low-intent traffic.`
                    : "ATC rate is not available yet."
                }
              />
              <FindingCard
                title="Checkout initiation"
                status={checkoutStartRate !== null && checkoutStartRate < 3 ? "Watch" : "Stable"}
                detail={
                  checkoutStartRate !== null
                    ? `Current proxy checkout-start rate is ${formatPercent(checkoutStartRate)}. If carts are healthy but checkout starts stay weak, the issue often sits in cart friction or shipping surprise.`
                    : "Checkout-start rate is not available yet."
                }
              />
              <FindingCard
                title="Checkout completion"
                status={checkoutCompletionRate !== null && checkoutCompletionRate < 35 ? "Actionable" : "Stable"}
                detail={
                  checkoutCompletionRate !== null
                    ? `Current proxy checkout-completion rate is ${formatPercent(checkoutCompletionRate)}. This is the strongest signal here when campaigns are still driving intent but sales stay soft.`
                    : "Checkout-completion rate is not available yet."
                }
              />
            </div>
          </Section>

          <Section
            title="Next Checks"
            subtitle="These are the highest-value additions for making this page decision-ready."
          >
            <div className="space-y-3">
              {[
                "Connect GA4 or storefront analytics so sessions become business truth instead of guessed traffic.",
                "Split checkout completion by device, market, and landing page before blaming ads broadly.",
                "Compare purchase CVR against MER and tracking gap before opening more budget.",
                "Add checkout error, payment, and shipping-friction signals once the store analytics layer is ready.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.58)] px-4 py-3 text-sm leading-6 text-[var(--muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

function FindingCard({
  title,
  detail,
  status,
}: {
  title: string;
  detail: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.58)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--ink)]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
        </div>
        <StatusPill status={status} />
      </div>
    </div>
  );
}
