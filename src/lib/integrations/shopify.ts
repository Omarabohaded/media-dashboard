import crypto from "crypto";

export const SHOPIFY_STATE_COOKIE = "shopify_oauth_state";
export const SHOPIFY_OAUTH_CLIENT_COOKIE = "shopify_oauth_client_id";

export type ShopifyConfig = {
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

export function getSecureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

export function normalizeShopifyStoreDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

export function isValidShopifyStoreDomain(value: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(
    normalizeShopifyStoreDomain(value)
  );
}

function buildNonJsonShopifyResponseError(storeDomain: string) {
  return `Shopify returned an HTML response for ${storeDomain} instead of API JSON. This usually means the app install or OAuth flow is not set up correctly for that store.`;
}

async function parseShopifyJsonResponse<T>(
  response: Response,
  storeDomain: string,
  fallbackMessage: string
): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(fallbackMessage);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    if (text.trim().startsWith("<")) {
      throw new Error(buildNonJsonShopifyResponseError(storeDomain));
    }

    throw new Error(fallbackMessage);
  }
}

export function getShopifyConfig(): ShopifyConfig {
  const clientId = requiredEnv("SHOPIFY_CLIENT_ID");
  const clientSecret = requiredEnv("SHOPIFY_CLIENT_SECRET");
  const apiVersion = requiredEnv("SHOPIFY_API_VERSION") || "2026-01";
  const requestedScopes = (requiredEnv("SHOPIFY_SCOPES") || "read_orders")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const missingEnv = ["SHOPIFY_CLIENT_ID", "SHOPIFY_CLIENT_SECRET"].filter(
    (key) => !requiredEnv(key)
  );

  return {
    clientId,
    clientSecret,
    apiVersion,
    requestedScopes,
    missingEnv,
  };
}

export function buildShopifyRedirectUri(origin: string) {
  return `${origin}/api/integrations/shopify/callback`;
}

export function buildShopifyOauthUrl(
  origin: string,
  storeDomain: string,
  state: string
) {
  const normalizedStoreDomain = normalizeShopifyStoreDomain(storeDomain);
  const config = getShopifyConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    scope: config.requestedScopes.join(","),
    redirect_uri: buildShopifyRedirectUri(origin),
    state,
  });

  return `https://${normalizedStoreDomain}/admin/oauth/authorize?${params.toString()}`;
}

export function verifyShopifyHmac(searchParams: URLSearchParams) {
  const providedHmac = searchParams.get("hmac") ?? "";
  const clientSecret = getShopifyConfig().clientSecret;

  if (!providedHmac || !clientSecret) {
    return false;
  }

  const message = [...searchParams.entries()]
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const digest = crypto
    .createHmac("sha256", clientSecret)
    .update(message)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(providedHmac, "utf8")
    );
  } catch {
    return false;
  }
}

export async function exchangeShopifyAuthorizationCode(
  origin: string,
  storeDomain: string,
  code: string
) {
  const normalizedStoreDomain = normalizeShopifyStoreDomain(storeDomain);

  if (!normalizedStoreDomain) {
    throw new Error("Shopify store domain is required.");
  }

  const config = getShopifyConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
  });

  const response = await fetch(
    `https://${normalizedStoreDomain}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    }
  );

  const payload = await parseShopifyJsonResponse<ShopifyTokenResponse>(
    response,
    normalizedStoreDomain,
    "Shopify authorization code exchange failed."
  );

  if (!response.ok || payload.error || !payload.access_token) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        "Shopify authorization code exchange failed."
    );
  }

  return payload;
}

async function shopifyAdminGraphql<T>(
  query: string,
  accessToken: string,
  storeDomain: string
) {
  const normalizedStoreDomain = normalizeShopifyStoreDomain(storeDomain);

  if (!normalizedStoreDomain) {
    throw new Error("Shopify store domain is required.");
  }

  const config = getShopifyConfig();
  const response = await fetch(
    `https://${normalizedStoreDomain}/admin/api/${config.apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    }
  );

  const payload = await parseShopifyJsonResponse<ShopifyGraphqlResponse<T>>(
    response,
    normalizedStoreDomain,
    "Shopify Admin API request failed."
  );

  if (!response.ok || payload.errors?.length) {
    throw new Error(
      payload.errors?.map((error) => error.message).join(", ") ||
        "Shopify Admin API request failed."
    );
  }

  return payload.data as T;
}

export async function fetchShopifyStoreTruthPreview(
  accessToken: string,
  storeDomain: string
) {
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
    accessToken,
    storeDomain
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
