export type WooCommerceStoreSnapshot = {
  storeName: string;
  currencyCode: string;
  ordersCount: number;
  grossSales: number;
  taxTotal: number;
  shippingTotal: number;
  netSales: number;
  averageOrderValue: number;
};

export type WooCommerceOrderPreviewRow = {
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

export type WooCommerceConnectionInput = {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
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

type WooCommerceSystemStatus = {
  environment?: {
    home_url?: string;
    site_url?: string;
    version?: string;
  };
  settings?: {
    currency?: string;
  };
};

export function normalizeWooCommerceStoreUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    return `${url.protocol}//${url.host}`.replace(/\/+$/, "");
  } catch {
    return withProtocol.replace(/\/+$/, "");
  }
}

function buildWooCommerceUrl(storeUrl: string, path: string) {
  const normalizedStoreUrl = normalizeWooCommerceStoreUrl(storeUrl);
  return `${normalizedStoreUrl}/wp-json/wc/v3${path}`;
}

async function wooCommerceGet<T>(
  connection: WooCommerceConnectionInput,
  path: string,
  searchParams?: Record<string, string>
) {
  const storeUrl = normalizeWooCommerceStoreUrl(connection.storeUrl);
  const params = new URLSearchParams(searchParams);
  const headers: HeadersInit = {
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(
      `${connection.consumerKey}:${connection.consumerSecret}`
    ).toString("base64")}`,
  };

  const response = await fetch(`${buildWooCommerceUrl(storeUrl, path)}?${params.toString()}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || "WooCommerce API request failed.");
  }

  if (!text.trim()) {
    throw new Error("WooCommerce returned an empty API response.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("WooCommerce returned a non-JSON API response. Check the store URL and permalink settings.");
  }
}

export async function validateWooCommerceConnection(connection: WooCommerceConnectionInput) {
  const storeUrl = normalizeWooCommerceStoreUrl(connection.storeUrl);

  if (!storeUrl) {
    throw new Error("Store URL is required.");
  }

  if (!connection.consumerKey.trim() || !connection.consumerSecret.trim()) {
    throw new Error("Consumer key and consumer secret are required.");
  }

  const [orders, systemStatus] = await Promise.all([
    wooCommerceGet<WooCommerceOrder[]>(
      { ...connection, storeUrl },
      "/orders",
      {
        per_page: "1",
        orderby: "date",
        order: "desc",
      }
    ),
    wooCommerceGet<WooCommerceSystemStatus>({ ...connection, storeUrl }, "/system_status"),
  ]);

  return {
    storeUrl,
    storeName:
      systemStatus.environment?.site_url ||
      systemStatus.environment?.home_url ||
      storeUrl,
    currencyCode: systemStatus.settings?.currency || orders[0]?.currency || "USD",
    wooCommerceVersion: systemStatus.environment?.version ?? null,
    latestOrderId: orders[0]?.id ?? null,
  };
}

export async function fetchWooCommerceStoreTruthPreview(connection: WooCommerceConnectionInput) {
  const storeUrl = normalizeWooCommerceStoreUrl(connection.storeUrl);
  const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const orders = await wooCommerceGet<WooCommerceOrder[]>(
    { ...connection, storeUrl },
    "/orders",
    {
      per_page: "50",
      orderby: "date",
      order: "desc",
      after: sinceDate,
    }
  );

  const rows = orders.map<WooCommerceOrderPreviewRow>((order) => ({
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

  const snapshot: WooCommerceStoreSnapshot = {
    storeName: storeUrl,
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
