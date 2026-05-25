export const SHOPIFY_TOKEN_COOKIE = "shopify_admin_access_token";

export type ShopifyConfig = {
  storeDomain: string;
  clientId: string;
  clientSecret: string;
  apiVersion: string;
  requestedScopes: string[];
  missingEnv: string[];
};

export type ShopifyStoreSnapshot = {
  shopName: string;
  currencyCode: string;
  primaryDomainUrl: string;
  ordersCount: number;
  grossSales: number;
  taxTotal: number;
  shippingTotal: number;
  netSales: number;
  averageOrderValue: number;
};

export type ShopifyOrderPreviewRow = {
  id: string;
  name: string;
  createdAt: string;
  totalPrice: number;
  taxTotal: number;
  shippingTotal: number;
  lineItemsQuantity: number;
  financialStatus: string;
};

type ShopifyTokenResponse = {
  access_token?: string;
  scope?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type ShopifyGraphqlResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
  }>;
};

function requiredEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function getShopifyConfig(): ShopifyConfig {
  const storeDomain = requiredEnv("SHOPIFY_STORE_DOMAIN");
  const clientId = requiredEnv("SHOPIFY_CLIENT_ID");
  const clientSecret = requiredEnv("SHOPIFY_CLIENT_SECRET");
  const apiVersion = requiredEnv("SHOPIFY_API_VERSION") || "2026-01";
  const requestedScopes = (
    requiredEnv("SHOPIFY_SCOPES") || "read_orders"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const missingEnv = [
    "SHOPIFY_STORE_DOMAIN",
    "SHOPIFY_CLIENT_ID",
    "SHOPIFY_CLIENT_SECRET",
  ].filter((key) => !requiredEnv(key));

  return {
    storeDomain,
    clientId,
    clientSecret,
    apiVersion,
    requestedScopes,
    missingEnv,
  };
}

export async function exchangeShopifyClientCredentials() {
  const config = getShopifyConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(
    `https://${config.storeDomain}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    }
  );

  const payload = (await response.json()) as ShopifyTokenResponse;

  if (!response.ok || payload.error || !payload.access_token) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        "Shopify token exchange failed."
    );
  }

  return payload;
}

async function shopifyAdminGraphql<T>(query: string, accessToken: string) {
  const config = getShopifyConfig();
  const response = await fetch(
    `https://${config.storeDomain}/admin/api/${config.apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    }
  );

  const payload = (await response.json()) as ShopifyGraphqlResponse<T>;

  if (!response.ok || payload.errors?.length) {
    throw new Error(
      payload.errors?.map((error) => error.message).join(", ") ||
        "Shopify Admin API request failed."
    );
  }

  return payload.data as T;
}

export async function fetchShopifyStoreTruthPreview(accessToken: string) {
  const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const data = await shopifyAdminGraphql<{
    shop: {
      name: string;
      currencyCode: string;
      primaryDomain: {
        url: string;
      } | null;
    };
    orders: {
      nodes: Array<{
        id: string;
        name: string;
        createdAt: string;
        displayFinancialStatus: string;
        currentSubtotalLineItemsQuantity: number;
        currentTotalPriceSet: {
          shopMoney: {
            amount: string;
          };
        };
        currentShippingPriceSet: {
          shopMoney: {
            amount: string;
          };
        };
        currentTotalTaxSet: {
          shopMoney: {
            amount: string;
          };
        };
      }>;
    };
  }>(
    `query ShopifyStoreTruthPreview {
      shop {
        name
        currencyCode
        primaryDomain {
          url
        }
      }
      orders(
        first: 50
        sortKey: CREATED_AT
        reverse: true
        query: "created_at:>=${sinceDate}"
      ) {
        nodes {
          id
          name
          createdAt
          displayFinancialStatus
          currentSubtotalLineItemsQuantity
          currentTotalPriceSet {
            shopMoney {
              amount
            }
          }
          currentShippingPriceSet {
            shopMoney {
              amount
            }
          }
          currentTotalTaxSet {
            shopMoney {
              amount
            }
          }
        }
      }
    }`,
    accessToken
  );

  const orders = data.orders.nodes.map<ShopifyOrderPreviewRow>((order) => ({
    id: order.id,
    name: order.name,
    createdAt: order.createdAt,
    totalPrice: Number(order.currentTotalPriceSet.shopMoney.amount),
    taxTotal: Number(order.currentTotalTaxSet.shopMoney.amount),
    shippingTotal: Number(order.currentShippingPriceSet.shopMoney.amount),
    lineItemsQuantity: order.currentSubtotalLineItemsQuantity,
    financialStatus: order.displayFinancialStatus,
  }));

  const grossSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const taxTotal = orders.reduce((sum, order) => sum + order.taxTotal, 0);
  const shippingTotal = orders.reduce(
    (sum, order) => sum + order.shippingTotal,
    0
  );
  const netSales = grossSales - taxTotal - shippingTotal;

  const snapshot: ShopifyStoreSnapshot = {
    shopName: data.shop.name,
    currencyCode: data.shop.currencyCode,
    primaryDomainUrl: data.shop.primaryDomain?.url ?? "",
    ordersCount: orders.length,
    grossSales,
    taxTotal,
    shippingTotal,
    netSales,
    averageOrderValue: orders.length ? grossSales / orders.length : 0,
  };

  return {
    snapshot,
    orders,
  };
}
