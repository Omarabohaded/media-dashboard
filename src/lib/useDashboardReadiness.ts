"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClientRecord, WebsitePlatform } from "@/lib/clientTypes";
import {
  DEFAULT_DASHBOARD_METRIC_LOGIC,
  type DashboardMetricLogicConfig,
} from "@/lib/dashboardMetricLogic";
import {
  ACTIVE_CLIENT_CHANGE_EVENT,
  ACTIVE_CLIENT_STORAGE_KEY,
  type ActiveClientChangeEvent,
} from "@/lib/clientContext";
import type { NormalizedPaidMediaRow, PaidMediaChannelSummary, PaidMediaSourceType } from "@/lib/paidMediaContract";

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

type WooCommerceStatusResponse = {
  configured: boolean;
  connected: boolean;
  previewReady: boolean;
  storeUrl: string;
  storeName: string | null;
  currencyCode: string | null;
  connectedAt: string | null;
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

type StoreTruthPreviewResponse = {
  snapshot: {
    storeName: string;
    currencyCode: string;
    ordersCount: number;
    grossSales: number;
    taxTotal: number;
    shippingTotal: number;
    netSales: number;
    averageOrderValue: number;
    rangeLabel?: string;
  };
  note?: string;
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
  platform: "shopify" | "wordpress" | "woocommerce";
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

export type DashboardPaidMediaReport = {
  clientId: string;
  rows: NormalizedPaidMediaRow[];
  channels: PaidMediaChannelSummary[];
  blended: Omit<PaidMediaChannelSummary, "sourceType">;
  includedChannels: PaidMediaSourceType[];
  issues: Array<{ sourceType: PaidMediaSourceType; message: string }>;
  implementationStatus: string;
};

type HookOptions = {
  includeStorePreview?: boolean;
  includeMetaPreview?: boolean;
  metaPreviewQuery?: string;
};

type DashboardDateChangeEvent = CustomEvent<{ datePreset?: string }>;

const DASHBOARD_DATE_PRESET_KEY = "media-dashboard-date-preset";
const DEFAULT_DATE_PRESET = "last_7d";
const DEFAULT_META_PREVIEW_QUERY = `datePreset=${DEFAULT_DATE_PRESET}`;
const SUPPORTED_DATE_PRESETS = new Set([
  "today",
  "yesterday",
  "last_7d",
  "last_30d",
  "this_month",
  "last_month",
  "custom",
]);

function getStoredDatePreset() {
  if (typeof window === "undefined") {
    return DEFAULT_DATE_PRESET;
  }

  const savedPreset = window.localStorage.getItem(DASHBOARD_DATE_PRESET_KEY);
  return savedPreset && SUPPORTED_DATE_PRESETS.has(savedPreset)
    ? savedPreset
    : DEFAULT_DATE_PRESET;
}

function getDatePreviewQuery(datePreset: string) {
  return `datePreset=${datePreset === "custom" ? DEFAULT_DATE_PRESET : datePreset}`;
}

function getDeclinedStoreMessage(platform: WebsitePlatform) {
  return platform === "shopify" || platform === "wordpress" || platform === "woocommerce"
    ? "This client has not granted website access. Keep storefront truth optional unless they choose to share it later."
    : "This client has not granted website access, so storefront truth is intentionally unavailable right now.";
}

function getStoreSourceLabel(platform: WebsitePlatform) {
  if (platform === "shopify") return "Shopify";
  if (platform === "woocommerce") return "WooCommerce";
  if (platform === "wordpress") return "WordPress / WooCommerce";
  return "Store truth not wired yet";
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
        : "This client website type is not connected yet. Start with Shopify or WooCommerce first.",
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
      : getStoreSourceLabel(platform),
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
  payload: ShopifyStatusResponse | WordPressStatusResponse | WooCommerceStatusResponse,
  client?: ClientRecord | null
): DashboardStoreStatus {
  const clientDeclinedAccess = Boolean(client?.storeAccessDeclined);

  if (platform === "shopify" && "storeDomain" in payload) {
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

  if (platform === "woocommerce" && "storeUrl" in payload) {
    const connected = payload.connected && !clientDeclinedAccess;
    const previewReady = payload.previewReady && !clientDeclinedAccess;
    return {
      platform,
      configured: payload.configured,
      connected,
      previewReady,
      sourceLabel: clientDeclinedAccess && !connected
        ? "Client declined website access"
        : payload.storeName || payload.storeUrl || "WooCommerce",
      missingEnv: [],
      connectionError: clientDeclinedAccess && !connected ? null : payload.connectionError,
      recommendedNextStep:
        clientDeclinedAccess && !connected
          ? getDeclinedStoreMessage(platform)
          : payload.recommendedNextStep,
      clientDeclinedAccess,
    };
  }

  const wordpressPayload = payload as WordPressStatusResponse;
  const connected = wordpressPayload.connected && !clientDeclinedAccess;
  const previewReady = wordpressPayload.previewReady && !clientDeclinedAccess;
  return {
    platform,
    configured: wordpressPayload.configured,
    connected,
    previewReady,
    sourceLabel: clientDeclinedAccess && !connected
      ? "Client declined website access"
      : wordpressPayload.siteUrl || "WordPress / WooCommerce",
    missingEnv: wordpressPayload.missingEnv,
    connectionError: clientDeclinedAccess && !connected ? null : wordpressPayload.connectionError,
    recommendedNextStep:
      clientDeclinedAccess && !connected
        ? getDeclinedStoreMessage(platform)
        : wordpressPayload.recommendedNextStep,
    clientDeclinedAccess,
  };
}

function normalizeStorePreview(
  platform: "shopify" | "wordpress" | "woocommerce",
  payload: ShopifyPreviewResponse | StoreTruthPreviewResponse
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

  const preview = payload as StoreTruthPreviewResponse;
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
    note:
      preview.note ??
      `${platform === "woocommerce" ? "WooCommerce" : "WordPress"} store-truth preview loaded for ${preview.snapshot.rangeLabel ?? "the selected reporting window"}.`,
  };
}

export function useDashboardReadiness(options: HookOptions = {}) {
  const {
    includeStorePreview = true,
    includeMetaPreview = true,
    metaPreviewQuery,
  } = options;
  const [datePreviewQuery, setDatePreviewQuery] = useState(DEFAULT_META_PREVIEW_QUERY);
  const effectiveMetaPreviewQuery = metaPreviewQuery ?? datePreviewQuery;
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [activeClientId, setActiveClientIdState] = useState("");
  const [metaStatus, setMetaStatus] = useState<DashboardMetaStatus | null>(null);
  const [metaPreview, setMetaPreview] = useState<DashboardMetaPreview | null>(null);
  const [paidMediaReport, setPaidMediaReport] = useState<DashboardPaidMediaReport | null>(null);
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

  async function loadMetricLogic(clientId?: string | null) {
    try {
      const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
      const response = await fetch(`/api/dashboard/metric-logic${query}`, {
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

    if (platform !== "shopify" && platform !== "wordpress" && platform !== "woocommerce") {
      setStoreStatus(defaultStoreStatus(platform, client));
      setStorePreview(null);
      return;
    }

    const statusQuery = `?clientId=${encodeURIComponent(clientId)}`;
    const previewQuery = `?clientId=${encodeURIComponent(clientId)}&${effectiveMetaPreviewQuery}`;
    const statusResponse = await fetch(
      `/api/integrations/${platform}/status${statusQuery}`,
      {
        cache: "no-store",
      }
    );
    const statusPayload = (await statusResponse.json()) as
      | ShopifyStatusResponse
      | WordPressStatusResponse
      | WooCommerceStatusResponse;
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
      `/api/integrations/${platform}/store-truth-preview${previewQuery}`,
      {
        cache: "no-store",
      }
    );
    const previewPayload = (await previewResponse.json()) as
      | ShopifyPreviewResponse
      | StoreTruthPreviewResponse
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
          ? window.localStorage.getItem(ACTIVE_CLIENT_STORAGE_KEY)
          : null);
      const { clientId: nextClientId, client } = await loadClients(clientId);
      await loadMetricLogic(nextClientId);

      if (!nextClientId || !client) {
        setMessage("Create a client in Admin first.");
        setMetaStatus(null);
        setMetaPreview(null);
        setPaidMediaReport(null);
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

      if (includeMetaPreview) {
        const paidMediaResponse = await fetch(
          `/api/dashboard/paid-media?clientId=${encodeURIComponent(nextClientId)}&${effectiveMetaPreviewQuery}`,
          { cache: "no-store" }
        );
        const paidMediaPayload = (await paidMediaResponse.json()) as DashboardPaidMediaReport | { error?: string };
        setPaidMediaReport(
          paidMediaResponse.ok && "blended" in paidMediaPayload ? paidMediaPayload : null
        );
      } else {
        setPaidMediaReport(null);
      }

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
      setPaidMediaReport(null);
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

    setDatePreviewQuery(getDatePreviewQuery(getStoredDatePreset()));

    function handleDateChange(event: Event) {
      const dateEvent = event as DashboardDateChangeEvent;
      const nextDatePreset = dateEvent.detail?.datePreset ?? getStoredDatePreset();
      setDatePreviewQuery(getDatePreviewQuery(nextDatePreset));
    }

    window.addEventListener("media-dashboard-date-change", handleDateChange);
    return () => window.removeEventListener("media-dashboard-date-change", handleDateChange);
  }, [metaPreviewQuery]);

  useEffect(() => {
    setMetaPreview(null);
    setPaidMediaReport(null);
    setStorePreview(null);
    void refresh();
  }, [effectiveMetaPreviewQuery]);

  useEffect(() => {
    function handleClientChange(event: Event) {
      const nextClientId = (event as ActiveClientChangeEvent).detail?.clientId;

      if (nextClientId) {
        setMetaPreview(null);
        setPaidMediaReport(null);
        setStorePreview(null);
        void refresh(nextClientId);
      }
    }

    window.addEventListener(ACTIVE_CLIENT_CHANGE_EVENT, handleClientChange);
    return () =>
      window.removeEventListener(ACTIVE_CLIENT_CHANGE_EVENT, handleClientChange);
  }, [activeClientId, effectiveMetaPreviewQuery]);

  function setActiveClientId(nextClientId: string) {
    setActiveClientIdState(nextClientId);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_CLIENT_STORAGE_KEY, nextClientId);
    }
  }

  return {
    clients,
    activeClientId,
    setActiveClientId,
    activeClient,
    metaStatus,
    metaPreview,
    paidMediaReport,
    storeStatus,
    storePreview,
    metricLogic,
    isLoading,
    message,
    setMessage,
    refresh,
  };
}
