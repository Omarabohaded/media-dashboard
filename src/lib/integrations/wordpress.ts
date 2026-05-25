export const WORDPRESS_CONNECTED_COOKIE = "wordpress_store_connected";

export type WordPressConfig = {
  siteUrl: string;
  apiVersion: string;
  consumerKey: string;
  consumerSecret: string;
  queryStringAuth: boolean;
  missingEnv: string[];
};

export type WordPressStoreSnapshot = {
  storeName: string;
  currencyCode: string;
  ordersCount: number;
  grossSales: number;
  taxTotal: number;
  shippingTotal: number;
  netSales: number;
  averageOrderValue: number;
};

export type WordPressOrderPreviewRow = {
  id: number;
  number: string;
  status: string;
  dateCreated: string;
  currency: string;
  total: number;
  totalTax: number;
  shippingTotal: number;
  lineItemsQuantity: number;
};

type WooCommerceOrder = {
  id: number;
  number?: string;
  status?: string;
  currency?: string;
  date_created?: string;
  total?: string;
  total_tax?: string;
  shipping_total?: string;
  line_items?: Array<{
    quantity?: number;
  }>;
};

function requiredEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function normalizeSiteUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function getWordPressConfig(): WordPressConfig {
  const siteUrl = normalizeSiteUrl(requiredEnv("WORDPRESS_SITE_URL"));
  const consumerKey = requiredEnv("WORDPRESS_WOOCOMMERCE_CONSUMER_KEY");
  const consumerSecret = requiredEnv("WORDPRESS_WOOCOMMERCE_CONSUMER_SECRET");
  const apiVersion = requiredEnv("WORDPRESS_WOOCOMMERCE_VERSION") || "wc/v3";
  const queryStringAuth =
    (requiredEnv("WORDPRESS_WOOCOMMERCE_QUERY_STRING_AUTH") || "false") ===
    "true";

  const missingEnv = [
    "WORDPRESS_SITE_URL",
    "WORDPRESS_WOOCOMMERCE_CONSUMER_KEY",
    "WORDPRESS_WOOCOMMERCE_CONSUMER_SECRET",
  ].filter((key) => !requiredEnv(key));

  return {
    siteUrl,
    apiVersion,
    consumerKey,
    consumerSecret,
    queryStringAuth,
    missingEnv,
  };
}

function buildWooCommerceUrl(path: string, config = getWordPressConfig()) {
  return `${config.siteUrl}/wp-json/${config.apiVersion}${path}`;
}

async function wooCommerceGet<T>(
  path: string,
  searchParams?: Record<string, string>
) {
  const config = getWordPressConfig();
  const params = new URLSearchParams(searchParams);

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (config.queryStringAuth) {
    params.set("consumer_key", config.consumerKey);
    params.set("consumer_secret", config.consumerSecret);
  } else {
    headers.Authorization = `Basic ${Buffer.from(
      `${config.consumerKey}:${config.consumerSecret}`
    ).toString("base64")}`;
  }

  const response = await fetch(
    `${buildWooCommerceUrl(path, config)}?${params.toString()}`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "WordPress/WooCommerce API request failed.");
  }

  return (await response.json()) as T;
}

export async function validateWordPressStoreConnection() {
  const orders = await wooCommerceGet<WooCommerceOrder[]>("/orders", {
    per_page: "1",
    orderby: "date",
    order: "desc",
  });

  return {
    storeName: getWordPressConfig().siteUrl,
    currencyCode: orders[0]?.currency || "USD",
  };
}

export async function fetchWordPressStoreTruthPreview() {
  const sinceDate = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const orders = await wooCommerceGet<WooCommerceOrder[]>("/orders", {
    per_page: "50",
    orderby: "date",
    order: "desc",
    after: sinceDate,
  });

  const rows = orders.map<WordPressOrderPreviewRow>((order) => ({
    id: order.id,
    number: order.number ?? `${order.id}`,
    status: order.status ?? "unknown",
    dateCreated: order.date_created ?? "",
    currency: order.currency ?? "USD",
    total: Number(order.total ?? 0),
    totalTax: Number(order.total_tax ?? 0),
    shippingTotal: Number(order.shipping_total ?? 0),
    lineItemsQuantity: (order.line_items ?? []).reduce(
      (sum, item) => sum + Number(item.quantity ?? 0),
      0
    ),
  }));

  const grossSales = rows.reduce((sum, row) => sum + row.total, 0);
  const taxTotal = rows.reduce((sum, row) => sum + row.totalTax, 0);
  const shippingTotal = rows.reduce((sum, row) => sum + row.shippingTotal, 0);
  const netSales = grossSales - taxTotal - shippingTotal;

  const snapshot: WordPressStoreSnapshot = {
    storeName: getWordPressConfig().siteUrl,
    currencyCode: rows[0]?.currency || "USD",
    ordersCount: rows.length,
    grossSales,
    taxTotal,
    shippingTotal,
    netSales,
    averageOrderValue: rows.length ? grossSales / rows.length : 0,
  };

  return {
    snapshot,
    orders: rows,
  };
}
