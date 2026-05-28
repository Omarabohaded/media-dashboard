"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClientRecord, WebsitePlatform } from "@/lib/clientTypes";
import {
  DEFAULT_DASHBOARD_METRIC_LOGIC,
  type DashboardMetricLogicConfig,
} from "@/lib/dashboardMetricLogic";

type ClientDirectoryResponse = {
  clients: ClientRecord[];
  activeClientId: string;
};

export type DashboardMetaStatus = {
  connected: boolean;
  selectedAccountId: string | null;
  selectedAccount: {
    id: string;
    name: string;
    currency?: string;
  } | null;
  syncReady: boolean;
  connectionError: string | null;
};

type ShopifyStatusResponse = {
  platform: "shopify";
  configured: boolean;
  connected: boolean;
  previewReady: boolean;
  storeDomain: string;
  missingEnv: string[];
  usesMockData: boolean;
  connectionError: string | null;
  recommendedNextStep: string;
};

type WordPressStatusResponse = {
  platform: "wordpress";
  configured: boolean;
  connected: boolean;
  previewReady: boolean;
  siteUrl: string;
  missingEnv: string[];
  usesMockData: boolean;
  connectionError: string | null;
  recommendedNextStep: string;
};

type ShopifyPreviewResponse = {
  snapshot: {
    shopName: string;
    currencyCode: string;
    ordersCount: number;
    grossSales: number;
    taxTotal: number;
    shippingTotal: number;
    netSales: number;
    averageOrderValue: number;
  };
  note: string;
};

type WordPressPreviewResponse = {
  snapshot: {
    storeName: string;
    currencyCode: string;
    ordersCount: number;
    grossSales: number;
    taxTotal: number;
    shippingTotal: number;
    netSales: number;
    averageOrderValue: number;
  };
  note: string;
};

type DashboardMetricLogicResponse = {
  metricLogic: DashboardMetricLogicConfig;
};

export type DashboardStoreStatus = {
  platform: WebsitePlatform;
  configured: boolean;
  connected: boolean;
  previewReady: boolean;
  sourceLabel: string;
  missingEnv: string[];
  connectionError: string | null;
  recommendedNextStep: string;
  clientDeclinedAccess: boolean;
};

export type DashboardStorePreview = {
  platform: "shopify" | "wordpress";
  storeName: string;
  currencyCode: string;
  ordersCount: number;
  grossSales: number;
  taxTotal: number;
  shippingTotal: number;
  netSales: number;
  averageOrderValue: number;
  note: string;
};

export type DashboardMetaPreview = {
  accountId: string;
  rows: Array<{
    campaignId: string;
    campaignName: string;
    spend: number;
    ctr: number;
    cpc?: number;
    cpm?: number;
    frequency: number;
    reach?: number;
    purchases: number;
    purchaseValue: number;
    addToCart?: number;
    checkoutInitiated?: number;
  }>;
  totals: {
    spend: number;
    purchases: number;
    purchaseValue: number;
    impressions: number;
    clicks: number;
  };
  note: string;
};

type HookOptions = {
  includeStorePreview?: boolean;
  includeMetaPreview?: boolean;
  metaPreviewQuery?: string;
};

const DASHBOARD_DATE_PRESET_KEY = "media-dashboard-date-preset";
const DASHBOARD_CUSTOM_START_KEY = "media-dashboard-custom-start";
const DASHBOARD_CUSTOM_END_KEY = "media-dashboard-custom-end";
const DEFAULT_META_PREVIEW_QUERY = "datePreset=last_7d";

function getDeclinedStoreMessage(platform: WebsitePlatform) {
  return platform === "shopify" || platform === "wordpress"
    ? "This client has not granted website access. Keep storefront truth optional unless they choose to share it later."
    : "This client has not granted website access, so storefront truth is intentionally unavailable right now.";
}

function defaultStoreStatus(
  platform: WebsitePlatform,
  client?: ClientRecord | null
): DashboardStoreStatus {
  const clientDeclinedAccess = Boolean(client?.storeAccessDeclined);

  if (platform === "custom" || platform === "salla" || platform === "wix") {
    return {
      platform,
      configured: false,
      connected: false,
      previewReady: false,
      sourceLabel: clientDeclinedAccess
        ? "Client declined website access"
        : "Store truth not wired yet",
      missingEnv: [],
      connectionError: null,
      recommendedNextStep: clientDeclinedAccess
        ? getDeclinedStoreMessage(platform)
        : "This client website type is not connected yet. Start with Shopify or WordPress/WooCommerce first.",
      clientDeclinedAccess,
    };
  }

  return {
    platform,
    configured: false,
    connected: false,
    previewReady: false,
    sourceLabel: clientDeclinedAccess
      ? "Client declined website access"
      : platform === "shopify"
      ? "Shopify"
      : "WordPress / WooCommerce",
    missingEnv: [],
    connectionError: null,
    recommendedNextStep: clientDeclinedAccess
      ? getDeclinedStoreMessage(platform)
      : "Connect the store-truth source before using business-health logic.",
    clientDeclinedAccess,
  };
}

function normalizeStoreStatus(
  platform: WebsitePlatform,
  payload: ShopifyStatusResponse | WordPressStatusResponse,
  client?: ClientRecord | null
): DashboardStoreStatus {
  const clientDeclinedAccess = Boolean(client?.storeAccessDeclined);

  if (payload.platform === "shopify") {
    const connected = payload.connected && !clientDeclinedAccess;
    const previewReady = payload.previewReady && !clientDeclinedAccess;
    return {
      platform,
      configured: payload.configured,
      connected,
      previewReady,
      sourceLabel: clientDeclinedAccess && !connected
        ? "Client declined website access"
        : payload.storeDomain || "Shopify",
      missingEnv: payload.missingEnv,
      connectionError: clientDeclinedAccess && !connected ? null : payload.connectionError,
      recommendedNextStep:
        clientDeclinedAccess && !connected
          ? getDeclinedStoreMessage(platform)
          : payload.recommendedNextStep,
      clientDeclinedAccess,
    };
  }

  const connected = payload.connected && !clientDeclinedAccess;
  const previewReady = payload.previewReady && !clientDeclinedAccess;
  return {
    platform,
    configured: payload.configured,
    connected,
    previewReady,
    sourceLabel: clientDeclinedAccess && !connected
      ? "Client declined website access"
      : payload.siteUrl || "WordPress / WooCommerce",
    missingEnv: payload.missingEnv,
    connectionError: clientDeclinedAccess && !connected ? null : payload.connectionError,
    recommendedNextStep:
      clientDeclinedAccess && !connected
        ? getDeclinedStoreMessage(platform)
        : payload.recommendedNextStep,
    clientDeclinedAccess,
  };
}

function normalizeStorePreview(
  platform: "shopify" | "wordpress",
  payload: ShopifyPreviewResponse | WordPressPreviewResponse
): DashboardStorePreview {
  if (platform === "shopify") {
    const preview = payload as ShopifyPreviewResponse;
    return {
      platform,
      storeName: preview.snapshot.shopName,
      currencyCode: preview.snapshot.currencyCode,
      ordersCount: preview.snapshot.ordersCount,
      grossSales: preview.snapshot.grossSales,
      taxTotal: preview.snapshot.taxTotal,
      shippingTotal: preview.snapshot.shippingTotal,
      netSales: preview.snapshot.netSales,
      averageOrderValue: preview.snapshot.averageOrderValue,
      note: preview.note,
    };
  }

  const preview = payload as WordPressPreviewResponse;
  return {
    platform,
    storeName: preview.snapshot.storeName,
    currencyCode: preview.snapshot.currencyCode,
    ordersCount: preview.snapshot.ordersCount,
    grossSales: preview.snapshot.grossSales,
    taxTotal: preview.snapshot.taxTotal,
    shippingTotal: preview.snapshot.shippingTotal,
    netSales: preview.snapshot.netSales,
    averageOrderValue: preview.snapshot.averageOrderValue,
    note: preview.note,
  };
}

function getStoredMetaPreviewQuery() {
  if (typeof window === "undefined") {
    return DEFAULT_META_PREVIEW_QUERY;
  }

  const savedPreset = window.localStorage.getItem(DASHBOARD_DATE_PRESET_KEY);

  if (savedPreset === "custom") {
    const startDate = window.localStorage.getItem(DASHBOARD_CUSTOM_START_KEY) ?? "";
    const endDate = window.localStorage.getItem(DASHBOARD_CUSTOM_END_KEY) ?? "";

    if (isStoredRangeValid(startDate, endDate)) {
      return `since=${encodeURIComponent(startDate)}&until=${encodeURIComponent(endDate)}`;
    }
  }

  return savedPreset ? `datePreset=${savedPreset}` : DEFAULT_META_PREVIEW_QUERY;
}

export function useDashboardReadiness(options: HookOptions = {}) {
  const {
    includeStorePreview = true,
    includeMetaPreview = true,
    metaPreviewQuery,
  } = options;
  const [storedMetaPreviewQuery, setStoredMetaPreviewQuery] = useState(
    DEFAULT_META_PREVIEW_QUERY
  );
  const effectiveMetaPreviewQuery = metaPreviewQuery ?? storedMetaPreviewQuery;
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [activeClientId, setActiveClientIdState] = useState("");
  const [metaStatus, setMetaStatus] = useState<DashboardMetaStatus | null>(null);
  const [metaPreview, setMetaPreview] = useState<DashboardMetaPreview | null>(null);
  const [storeStatus, setStoreStatus] = useState<DashboardStoreStatus | null>(null);
  const [storePreview, setStorePreview] = useState<DashboardStorePreview | null>(null);
  const [metricLogic, setMetricLogic] = useState<DashboardMetricLogicConfig>(
    DEFAULT_DASHBOARD_METRIC_LOGIC
  );
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const activeClient = useMemo(
    () =>
      clients.find((entry) => entry.id === activeClientId) ?? clients[0] ?? null,
    [activeClientId, clients]
  );

  async function loadClients(preferredClientId?: string | null) {
    const query = preferredClientId
      ? `?clientId=${encodeURIComponent(preferredClientId)}`
      : "";
    const response = await fetch(`/api/admin/clients${query}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as ClientDirectoryResponse;
    const nextClientId =
      preferredClientId &&
      payload.clients.some((client) => client.id === preferredClientId)
        ? preferredClientId
        : payload.activeClientId;

    setClients(payload.clients);
    setActiveClientIdState(nextClientId);
    return {
      clientId: nextClientId,
      client:
        payload.clients.find((entry) => entry.id === nextClientId) ??
        payload.clients[0] ??
        null,
    };
  }

  async function loadMetricLogic() {
    try {
      const response = await fetch("/api/dashboard/metric-logic", {
        cache: "no-store",
      });
      const payload = (await response.json()) as DashboardMetricLogicResponse;
      setMetricLogic(payload.metricLogic ?? DEFAULT_DASHBOARD_METRIC_LOGIC);
    } catch {
      setMetricLogic(DEFAULT_DASHBOARD_METRIC_LOGIC);
    }
  }

  async function loadStoreForPlatform(client: ClientRecord) {
    const { websitePlatform: platform, id: clientId } = client;

    if (platform !== "shopify" && platform !== "wordpress") {
      setStoreStatus(defaultStoreStatus(platform, client));
      setStorePreview(null);
      return;
    }

    const query = `?clientId=${encodeURIComponent(clientId)}`;
    const statusResponse = await fetch(
      `/api/integrations/${platform}/status${query}`,
      {
        cache: "no-store",
      }
    );
    const statusPayload = (await statusResponse.json()) as
      | ShopifyStatusResponse
      | WordPressStatusResponse;
    const nextStoreStatus = normalizeStoreStatus(platform, statusPayload, client);
    setStoreStatus(nextStoreStatus);

    if (
      !includeStorePreview ||
      !nextStoreStatus.previewReady ||
      nextStoreStatus.clientDeclinedAccess
    ) {
      setStorePreview(null);
      return;
    }

    const previewResponse = await fetch(
      `/api/integrations/${platform}/store-truth-preview${query}`,
      {
        cache: "no-store",
      }
    );
    const previewPayload = (await previewResponse.json()) as
      | ShopifyPreviewResponse
      | WordPressPreviewResponse
      | { error?: string };

    if (!previewResponse.ok || !("snapshot" in previewPayload)) {
      setStorePreview(null);
      setMessage(
        "Store truth is configured, but the preview could not be loaded yet."
      );
      return;
    }

    setStorePreview(normalizeStorePreview(platform, previewPayload));
  }

  async function refresh(clientIdOverride?: string) {
    setIsLoading(true);

    try {
      const clientId =
        clientIdOverride ||
        activeClientId ||
        (typeof window !== "undefined"
          ? window.localStorage.getItem("media-dashboard-active-client")
          : null);
      const { clientId: nextClientId, client } = await loadClients(clientId);
      await loadMetricLogic();

      if (!nextClientId || !client) {
        setMessage("Create a client in Admin first.");
        setMetaStatus(null);
        setMetaPreview(null);
        setStoreStatus(null);
        setStorePreview(null);
        return;
      }

      const metaStatusResponse = await fetch(
        `/api/integrations/meta/status?clientId=${encodeURIComponent(nextClientId)}`,
        {
          cache: "no-store",
        }
      );
      const nextMetaStatus = (await metaStatusResponse.json()) as DashboardMetaStatus;
      setMetaStatus(nextMetaStatus);

      if (
        includeMetaPreview &&
        nextMetaStatus.connected &&
        nextMetaStatus.selectedAccountId
      ) {
        const previewResponse = await fetch(
          `/api/integrations/meta/insights-preview?clientId=${encodeURIComponent(
            nextClientId
          )}&${effectiveMetaPreviewQuery}`,
          {
            cache: "no-store",
          }
        );
        const previewPayload = (await previewResponse.json()) as
          | DashboardMetaPreview
          | { error?: string };

        if (previewResponse.ok && "totals" in previewPayload) {
          setMetaPreview(previewPayload);
        } else {
          setMetaPreview(null);
          setMessage(
            "Meta is connected, but the live preview could not be loaded for this tab."
          );
        }
      } else {
        setMetaPreview(null);
      }

      await loadStoreForPlatform(client);
    } catch {
      setMessage("Could not load the dashboard state.");
      setMetaStatus(null);
      setMetaPreview(null);
      setStoreStatus(null);
      setStorePreview(null);
      setMetricLogic(DEFAULT_DASHBOARD_METRIC_LOGIC);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (metaPreviewQuery) {
      return;
    }

    setStoredMetaPreviewQuery(getStoredMetaPreviewQuery());
  }, [metaPreviewQuery]);

  useEffect(() => {
    void refresh();
  }, [effectiveMetaPreviewQuery]);

  function setActiveClientId(nextClientId: string) {
    setActiveClientIdState(nextClientId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("media-dashboard-active-client", nextClientId);
    }
  }

  return {
    clients,
    activeClientId,
    setActiveClientId,
    activeClient,
    metaStatus,
    metaPreview,
    storeStatus,
    storePreview,
    metricLogic,
    isLoading,
    message,
    setMessage,
    refresh,
  };
}

function isStoredRangeValid(startDate: string, endDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return false;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  return start.getTime() <= end.getTime();
}
