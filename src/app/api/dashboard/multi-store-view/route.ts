import { NextRequest, NextResponse } from "next/server";
import {
  buildDashboardMetricLogic,
  getEffectiveAov,
  getEffectiveCpaCac,
  getEffectiveMer,
  getEffectiveOrders,
  getEffectiveStoreRevenue,
} from "@/lib/dashboardMetricLogic";
import {
  getMetaConnection,
  getShopifyConnection,
  getWooCommerceConnection,
  listClients,
} from "@/lib/clientStore";
import type { ClientCurrencyCode } from "@/lib/clientTypes";
import { fetchMetaInsightsPreviewForRange } from "@/lib/integrations/meta";
import {
  fetchShopifyStoreTruthPreview,
  getShopifyConfig,
} from "@/lib/integrations/shopify";
import {
  fetchWooCommerceStoreTruthPreview,
  type WooCommerceDatePreset,
} from "@/lib/integrations/woocommerce";
import {
  fetchWordPressStoreTruthPreview,
  getWordPressConfig,
} from "@/lib/integrations/wordpress";
import { listMetricMappings } from "@/lib/metricMappingStore";
import { listMetricOverrides } from "@/lib/metricOverrideStore";
import { requireClientManagementAccess } from "@/lib/serverAccess";

type MultiStoreCard = {
  clientId: string;
  storeName: string;
  websitePlatform: string;
  currencyCode: ClientCurrencyCode;
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

function toClientCurrencyCode(
  value: string | null | undefined,
  fallback: ClientCurrencyCode
): ClientCurrencyCode {
  if (value === "USD" || value === "AED" || value === "SAR" || value === "EGP") {
    return value;
  }

  return fallback;
}

function toWooCommerceDatePreset(value: string | null | undefined): WooCommerceDatePreset | undefined {
  if (
    value === "today" ||
    value === "yesterday" ||
    value === "last_7d" ||
    value === "last_30d" ||
    value === "this_month" ||
    value === "last_month" ||
    value === "custom"
  ) {
    return value;
  }

  return undefined;
}

export async function GET(request: NextRequest) {
  const access = await requireClientManagementAccess();
  if (access.response) return access.response;
  try {
    const clients = await listClients();
    const [overrides, mappings] = await Promise.all([
      listMetricOverrides(),
      listMetricMappings(),
    ]);

    const datePreset = request.nextUrl.searchParams.get("datePreset") ?? undefined;
    const since = request.nextUrl.searchParams.get("since") ?? undefined;
    const until = request.nextUrl.searchParams.get("until") ?? undefined;

    const shopifyConfig = getShopifyConfig();
    const wordpressConfig = getWordPressConfig();
    const eligibleWordPressClients = clients.filter(
      (client) => client.websitePlatform === "wordpress" && !client.storeAccessDeclined
    );

    const sharedWordPressPreview =
      eligibleWordPressClients.length === 1 && wordpressConfig.missingEnv.length === 0
        ? await fetchWordPressStoreTruthPreview().catch(() => null)
        : null;

    const cards = await Promise.all(
      clients.map(async (client): Promise<MultiStoreCard> => {
        const metricLogic = buildDashboardMetricLogic(overrides, mappings, {
          clientId: client.id,
        });
        const issues: string[] = [];
        let adSpend: number | null = null;
        let websiteSales: number | null = null;
        let roas: number | null = null;
        let orders: number | null = null;
        let aov: number | null = null;
        let costPerOrder: number | null = null;
        let currencyCode: ClientCurrencyCode = client.currencyCode;
        let storeConnected = false;
        let metaConnected = false;
        let storeSourceLabel = "Store truth unavailable";
        let metaSourceLabel = "Paid media unavailable";
        let storeSnapshot:
          | {
              grossSales: number;
              netSales: number;
              ordersCount: number;
              currencyCode: ClientCurrencyCode;
              taxTotal?: number;
              shippingTotal?: number;
              averageOrderValue?: number;
            }
          | null = null;
        let metaSnapshot:
          | {
              totals: {
                spend: number;
                purchases: number;
                purchaseValue: number;
                clicks: number;
                impressions: number;
              };
            }
          | null = null;

        if (client.storeAccessDeclined) {
          issues.push("This client has not granted website access.");
          storeSourceLabel = "Website access declined";
        } else if (client.websitePlatform === "shopify") {
          const connection = await getShopifyConnection(client.id);

          if (shopifyConfig.missingEnv.length > 0) {
            issues.push("Shopify app credentials are not configured.");
            storeSourceLabel = "Shopify app not configured";
          } else if (!connection?.storeDomain || !connection.accessToken) {
            issues.push("Shopify is not connected for this client.");
            storeSourceLabel = "Shopify not connected";
          } else {
            try {
              const preview = await fetchShopifyStoreTruthPreview(
                connection.accessToken,
                connection.storeDomain
              );
              storeSnapshot = {
                grossSales: preview.snapshot.grossSales,
                netSales: preview.snapshot.netSales,
                ordersCount: preview.snapshot.ordersCount,
                currencyCode: toClientCurrencyCode(
                  preview.snapshot.currencyCode,
                  currencyCode
                ),
              };
              currencyCode = toClientCurrencyCode(
                preview.snapshot.currencyCode,
                currencyCode
              );
              storeConnected = true;
              storeSourceLabel = connection.storeDomain;
            } catch (error) {
              issues.push(
                error instanceof Error
                  ? error.message
                  : "Shopify preview could not be loaded."
              );
              storeSourceLabel = connection.storeDomain;
            }
          }
        } else if (client.websitePlatform === "woocommerce") {
          const connection = await getWooCommerceConnection(client.id);

          if (!connection?.storeUrl || !connection.consumerKey || !connection.consumerSecret) {
            issues.push("WooCommerce is not connected for this client.");
            storeSourceLabel = "WooCommerce not connected";
          } else {
            try {
              const preview = await fetchWooCommerceStoreTruthPreview(
                {
                  storeUrl: connection.storeUrl,
                  consumerKey: connection.consumerKey,
                  consumerSecret: connection.consumerSecret,
                },
                { datePreset: toWooCommerceDatePreset(datePreset) }
              );
              storeSnapshot = {
                grossSales: preview.snapshot.grossSales,
                netSales: preview.snapshot.netSales,
                ordersCount: preview.snapshot.ordersCount,
                currencyCode: toClientCurrencyCode(preview.snapshot.currencyCode, currencyCode),
                taxTotal: preview.snapshot.taxTotal,
                shippingTotal: preview.snapshot.shippingTotal,
                averageOrderValue: preview.snapshot.averageOrderValue,
              };
              currencyCode = toClientCurrencyCode(preview.snapshot.currencyCode, currencyCode);
              storeConnected = true;
              storeSourceLabel = connection.storeName || connection.storeUrl;
            } catch (error) {
              issues.push(
                error instanceof Error
                  ? error.message
                  : "WooCommerce preview could not be loaded."
              );
              storeSourceLabel = connection.storeUrl;
            }
          }
        } else if (client.websitePlatform === "wordpress") {
          if (eligibleWordPressClients.length > 1) {
            issues.push(
              "WordPress store truth is still global in this project, so multiple WordPress clients cannot be compared safely yet."
            );
            storeSourceLabel = "WordPress is still global";
          } else if (wordpressConfig.missingEnv.length > 0) {
            issues.push("WordPress / WooCommerce is not configured.");
            storeSourceLabel = "WordPress not configured";
          } else if (!sharedWordPressPreview) {
            issues.push("WordPress preview could not be loaded.");
            storeSourceLabel = wordpressConfig.siteUrl || "WordPress";
          } else {
            storeSnapshot = {
              grossSales: sharedWordPressPreview.snapshot.grossSales,
              netSales: sharedWordPressPreview.snapshot.netSales,
              ordersCount: sharedWordPressPreview.snapshot.ordersCount,
              currencyCode: toClientCurrencyCode(
                sharedWordPressPreview.snapshot.currencyCode,
                currencyCode
              ),
            };
            currencyCode = toClientCurrencyCode(
              sharedWordPressPreview.snapshot.currencyCode,
              currencyCode
            );
            storeConnected = true;
            storeSourceLabel = sharedWordPressPreview.snapshot.storeName;
          }
        } else {
          issues.push(
            `${client.websitePlatform} store truth is not wired into portfolio comparison yet.`
          );
          storeSourceLabel = `${client.websitePlatform} not wired`;
        }

        const metaConnection = await getMetaConnection(client.id);

        if (!metaConnection?.accessToken || !metaConnection.selectedAccountId) {
          issues.push("Meta is not connected for this client.");
          metaSourceLabel = "Meta not connected";
        } else {
          try {
            const rows = await fetchMetaInsightsPreviewForRange(
              metaConnection.accessToken,
              metaConnection.selectedAccountId,
              {
                datePreset,
                since,
                until,
              }
            );
            metaSnapshot = {
              totals: {
                spend: rows.reduce((sum, row) => sum + row.spend, 0),
                purchases: rows.reduce((sum, row) => sum + row.purchases, 0),
                purchaseValue: rows.reduce((sum, row) => sum + row.purchaseValue, 0),
                clicks: rows.reduce((sum, row) => sum + (row.clicks ?? 0), 0),
                impressions: rows.reduce((sum, row) => sum + (row.impressions ?? 0), 0),
              },
            };
            adSpend = metaSnapshot.totals.spend;
            metaConnected = true;
            metaSourceLabel =
              metaConnection.selectedAccountName || metaConnection.selectedAccountId;
          } catch (error) {
            issues.push(
              error instanceof Error
                ? error.message
                : "Meta preview could not be loaded."
            );
            metaSourceLabel =
              metaConnection.selectedAccountName || metaConnection.selectedAccountId;
          }
        }

        if (storeSnapshot) {
          websiteSales = getEffectiveStoreRevenue(storeSnapshot, metricLogic);
          orders = getEffectiveOrders(storeSnapshot, metricLogic);
          aov = getEffectiveAov(storeSnapshot, metricLogic);
        }

        if (storeSnapshot && metaSnapshot) {
          roas = getEffectiveMer(storeSnapshot, metaSnapshot, metricLogic);
        }

        if (metaSnapshot && storeSnapshot) {
          costPerOrder = getEffectiveCpaCac(metaSnapshot, storeSnapshot, {
            ...metricLogic,
            cpaDenominatorChoice: "orders",
          }).value;
        }

        const status =
          storeConnected && metaConnected
            ? "ready"
            : storeConnected || metaConnected
            ? "partial"
            : "blocked";

        return {
          clientId: client.id,
          storeName: client.name,
          websitePlatform: client.websitePlatform,
          currencyCode,
          adSpend,
          websiteSales,
          roas,
          orders,
          aov,
          costPerOrder,
          status,
          storeConnected,
          metaConnected,
          storeSourceLabel,
          metaSourceLabel,
          issues,
        };
      })
    );

    return NextResponse.json({
      cards,
      summary: {
        totalStores: cards.length,
        readyStores: cards.filter((card) => card.status === "ready").length,
        partialStores: cards.filter((card) => card.status === "partial").length,
        blockedStores: cards.filter((card) => card.status === "blocked").length,
        currencies: [...new Set(cards.map((card) => card.currencyCode))],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load the multi-store portfolio view.",
      },
      { status: 500 }
    );
  }
}
