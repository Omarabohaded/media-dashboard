"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, MiniMetric, Section, StatusPill } from "../../components/AppShell";
import { Database, Plug, ShieldCheck, Store, Workflow } from "lucide-react";

type WebsitePlatform = "shopify" | "wordpress" | "salla" | "wix" | "custom";

type ClientRecord = {
  id: string;
  name: string;
  websitePlatform: WebsitePlatform;
  notes: string | null;
  createdAt: string;
};

type ClientDirectoryResponse = {
  clients: ClientRecord[];
  activeClientId: string;
};

type MetaAccountOption = {
  id: string;
  name: string;
  currency?: string;
  timezone_name?: string;
};

type MetaStatus = {
  client: ClientRecord;
  platform: "meta";
  configured: boolean;
  connected: boolean;
  accountFetchHealthy: boolean;
  appMode: string;
  scopes: string[];
  callbackUrl: string;
  missingEnv: string[];
  usesMockData: boolean;
  selectedAccountId: string | null;
  selectedAccount: MetaAccountOption | null;
  accounts: MetaAccountOption[];
  connectionError: string | null;
  syncReady: boolean;
  recommendedNextStep: string;
};

type MetaInsightsPreview = {
  accountId: string;
  rows: Array<{
    campaignId: string;
    campaignName: string;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    cpm: number;
    frequency: number;
    reach: number;
    purchases: number;
    purchaseValue: number;
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

type ShopifyStatus = {
  platform: "shopify";
  configured: boolean;
  connected: boolean;
  previewReady: boolean;
  storeDomain: string;
  apiVersion: string;
  requestedScopes: string[];
  missingEnv: string[];
  usesMockData: boolean;
  shopName: string | null;
  connectionError: string | null;
  recommendedNextStep: string;
};

type ShopifyStoreTruthPreview = {
  snapshot: {
    shopName: string;
    currencyCode: string;
    ordersCount: number;
    grossSales: number;
    netSales: number;
    averageOrderValue: number;
  };
  note: string;
};

type WordPressStatus = {
  platform: "wordpress";
  configured: boolean;
  connected: boolean;
  previewReady: boolean;
  siteUrl: string;
  apiVersion: string;
  queryStringAuth: boolean;
  missingEnv: string[];
  usesMockData: boolean;
  storeName: string | null;
  currencyCode: string | null;
  connectionError: string | null;
  recommendedNextStep: string;
};

type WordPressStoreTruthPreview = {
  snapshot: {
    storeName: string;
    currencyCode: string;
    ordersCount: number;
    grossSales: number;
    netSales: number;
    averageOrderValue: number;
  };
  note: string;
};

type SyncStateResponse = {
  version: 1;
  storageMode: "ephemeral_tmp";
  updatedAt: string | null;
  connections: Array<{
    clientId: string;
    clientName: string;
    platform: string;
    accountLabel: string;
    accountId: string | null;
    health: string;
    scopes: string[];
    lastError: string | null;
    connectedAt: string | null;
    lastSyncedAt: string | null;
    sourceMode: "live" | "mock" | "ephemeral";
    recommendedNextStep: string;
  }>;
  syncRuns: Array<{
    id: string;
    clientId: string | null;
    clientName: string | null;
    platform: string;
    status: string;
    finishedAt: string | null;
    startedAt: string | null;
    recordsProcessed: number;
    error: string | null;
    notes: string[];
  }>;
  businessTruthSnapshots: Array<{
    clientId: string;
    clientName: string;
    source: string;
    netSales: number;
    orders: number;
    averageOrderValue: number;
  }>;
  mediaSnapshots: Array<{
    clientId: string;
    clientName: string;
    platform: string;
    accountLabel: string;
    spend: number;
    purchaseValue: number;
  }>;
  storage: {
    filePath: string;
    storageMode: "ephemeral_tmp";
  };
  note: string;
};

function Surface({
  title,
  eyebrow,
  status,
  children,
}: {
  title: string;
  eyebrow: string;
  status: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-slate-400">
            {eyebrow}
          </div>
          <h3 className="mt-2 text-2xl font-black text-white">{title}</h3>
        </div>
        <StatusPill status={status} />
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EnvList({ values }: { values: string[] }) {
  if (!values.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4">
      <div className="text-sm font-bold uppercase text-red-300">
        Missing Environment Values
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-full bg-red-950/70 px-3 py-1 text-xs font-bold text-red-200"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function MessageBox({
  tone = "warn",
  message,
}: {
  tone?: "warn" | "info";
  message: string | null;
}) {
  if (!message) {
    return null;
  }

  const styles =
    tone === "info"
      ? "border-cyan-500/30 bg-cyan-950/20 text-cyan-200"
      : "border-amber-500/30 bg-amber-950/20 text-amber-200";

  return <div className={`rounded-2xl border p-4 text-sm ${styles}`}>{message}</div>;
}

export default function AdminPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [activeClientId, setActiveClientId] = useState("");
  const [clientNameDraft, setClientNameDraft] = useState("");
  const [clientNotesDraft, setClientNotesDraft] = useState("");
  const [websitePlatformDraft, setWebsitePlatformDraft] =
    useState<WebsitePlatform>("shopify");
  const [clientMessage, setClientMessage] = useState<string | null>(null);
  const [isClientLoading, setIsClientLoading] = useState(true);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null);
  const [metaInsights, setMetaInsights] = useState<MetaInsightsPreview | null>(null);
  const [metaMessage, setMetaMessage] = useState<string | null>(null);
  const [accountDraft, setAccountDraft] = useState("");
  const [isMetaLoading, setIsMetaLoading] = useState(true);
  const [isMetaPreviewLoading, setIsMetaPreviewLoading] = useState(false);
  const [isMetaSyncRunning, setIsMetaSyncRunning] = useState(false);

  const [shopifyStatus, setShopifyStatus] = useState<ShopifyStatus | null>(null);
  const [shopifyPreview, setShopifyPreview] = useState<ShopifyStoreTruthPreview | null>(null);
  const [shopifyMessage, setShopifyMessage] = useState<string | null>(null);
  const [isShopifyLoading, setIsShopifyLoading] = useState(true);
  const [isShopifyPreviewLoading, setIsShopifyPreviewLoading] = useState(false);
  const [isShopifySyncRunning, setIsShopifySyncRunning] = useState(false);

  const [wordpressStatus, setWordpressStatus] = useState<WordPressStatus | null>(null);
  const [wordpressPreview, setWordpressPreview] =
    useState<WordPressStoreTruthPreview | null>(null);
  const [wordpressMessage, setWordpressMessage] = useState<string | null>(null);
  const [isWordPressLoading, setIsWordPressLoading] = useState(true);
  const [isWordPressPreviewLoading, setIsWordPressPreviewLoading] =
    useState(false);

  const [syncState, setSyncState] = useState<SyncStateResponse | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSyncLoading, setIsSyncLoading] = useState(true);

  const activeClient = useMemo(
    () =>
      clients.find((client) => client.id === activeClientId) ??
      clients[0] ??
      null,
    [activeClientId, clients]
  );

  async function loadClients(preferredClientId?: string | null) {
    setIsClientLoading(true);

    try {
      const query = preferredClientId
        ? `?clientId=${encodeURIComponent(preferredClientId)}`
        : "";
      const response = await fetch(`/api/admin/clients${query}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ClientDirectoryResponse;
      setClients(payload.clients);

      const nextClientId =
        preferredClientId &&
        payload.clients.some((client) => client.id === preferredClientId)
          ? preferredClientId
          : payload.activeClientId;

      setActiveClientId(nextClientId);
      window.localStorage.setItem("media-dashboard-active-client", nextClientId);
    } catch (error) {
      setClientMessage(
        error instanceof Error ? error.message : "Could not load clients."
      );
    } finally {
      setIsClientLoading(false);
    }
  }

  async function loadMetaStatus() {
    if (!activeClientId) {
      setMetaStatus(null);
      setIsMetaLoading(false);
      return;
    }

    setIsMetaLoading(true);

    try {
      const response = await fetch(
        `/api/integrations/meta/status?clientId=${encodeURIComponent(activeClientId)}`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as MetaStatus;
      setMetaStatus(payload);
      setAccountDraft(payload.selectedAccountId ?? payload.accounts[0]?.id ?? "");
    } catch (error) {
      setMetaMessage(
        error instanceof Error ? error.message : "Could not load Meta status."
      );
    } finally {
      setIsMetaLoading(false);
    }
  }

  async function loadShopifyStatus() {
    setIsShopifyLoading(true);

    try {
      const response = await fetch("/api/integrations/shopify/status", {
        cache: "no-store",
      });
      const payload = (await response.json()) as ShopifyStatus;
      setShopifyStatus(payload);
    } catch (error) {
      setShopifyMessage(
        error instanceof Error ? error.message : "Could not load Shopify status."
      );
    } finally {
      setIsShopifyLoading(false);
    }
  }

  async function loadWordPressStatus() {
    setIsWordPressLoading(true);

    try {
      const response = await fetch("/api/integrations/wordpress/status", {
        cache: "no-store",
      });
      const payload = (await response.json()) as WordPressStatus;
      setWordpressStatus(payload);
    } catch (error) {
      setWordpressMessage(
        error instanceof Error ? error.message : "Could not load WordPress status."
      );
    } finally {
      setIsWordPressLoading(false);
    }
  }

  async function loadSyncState() {
    setIsSyncLoading(true);

    try {
      const response = await fetch("/api/sync/state", {
        cache: "no-store",
      });
      const payload = (await response.json()) as SyncStateResponse;
      setSyncState(payload);
    } catch (error) {
      setSyncMessage(
        error instanceof Error ? error.message : "Could not load sync state."
      );
    } finally {
      setIsSyncLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preferredFromUrl = params.get("clientId");
    const preferredFromStorage = window.localStorage.getItem(
      "media-dashboard-active-client"
    );

    void loadClients(preferredFromUrl ?? preferredFromStorage);
    void loadShopifyStatus();
    void loadWordPressStatus();
    void loadSyncState();

    const connected = params.get("meta_connected");
    const error = params.get("meta_error");

    if (connected === "1") {
      setMetaMessage("Meta connected. Now choose the ad account for this client.");
    } else if (error) {
      setMetaMessage(decodeURIComponent(error));
    }
  }, []);

  useEffect(() => {
    if (!activeClientId) {
      return;
    }

    void loadMetaStatus();
  }, [activeClientId]);

  async function handleCreateClient() {
    const trimmedName = clientNameDraft.trim();

    if (!trimmedName) {
      setClientMessage("Client name is required.");
      return;
    }

    setClientMessage(null);
    setIsCreatingClient(true);

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          websitePlatform: websitePlatformDraft,
          notes: clientNotesDraft,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        client?: ClientRecord;
      };

      if (!response.ok || !payload.client) {
        throw new Error(payload.error ?? "Could not create the client.");
      }

      setClientNameDraft("");
      setClientNotesDraft("");
      await loadClients(payload.client.id);
      setMetaMessage("Client created. You can now connect Meta for this client.");
    } catch (error) {
      setClientMessage(
        error instanceof Error ? error.message : "Could not create the client."
      );
    } finally {
      setIsCreatingClient(false);
    }
  }

  async function handleDisconnectMeta() {
    const response = await fetch(
      `/api/integrations/meta/status?clientId=${encodeURIComponent(activeClientId)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      setMetaMessage("Could not disconnect Meta.");
      return;
    }

    setMetaInsights(null);
    await loadMetaStatus();
  }

  async function handleAccountSelect() {
    if (!accountDraft) {
      setMetaMessage("Choose an ad account first.");
      return;
    }

    const response = await fetch("/api/integrations/meta/account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountId: accountDraft, clientId: activeClientId }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setMetaMessage(payload.error ?? "Could not save the Meta ad account.");
      return;
    }

    await loadMetaStatus();
    setMetaMessage("Meta ad account saved for this client.");
  }

  async function handleMetaPreview() {
    setIsMetaPreviewLoading(true);

    try {
      const response = await fetch(
        `/api/integrations/meta/insights-preview?clientId=${encodeURIComponent(activeClientId)}`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as MetaInsightsPreview & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load Meta preview.");
      }

      setMetaInsights(payload);
    } catch (error) {
      setMetaMessage(
        error instanceof Error ? error.message : "Could not load Meta preview."
      );
    } finally {
      setIsMetaPreviewLoading(false);
    }
  }

  async function handleShopifyConnect() {
    setIsShopifyLoading(true);

    try {
      const response = await fetch("/api/integrations/shopify/connect", {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not connect Shopify.");
      }

      await loadShopifyStatus();
    } catch (error) {
      setShopifyMessage(
        error instanceof Error ? error.message : "Could not connect Shopify."
      );
    } finally {
      setIsShopifyLoading(false);
    }
  }

  async function handleShopifyPreview() {
    setIsShopifyPreviewLoading(true);

    try {
      const response = await fetch("/api/integrations/shopify/store-truth-preview", {
        cache: "no-store",
      });
      const payload = (await response.json()) as ShopifyStoreTruthPreview & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load Shopify preview.");
      }

      setShopifyPreview(payload);
    } catch (error) {
      setShopifyMessage(
        error instanceof Error ? error.message : "Could not load Shopify preview."
      );
    } finally {
      setIsShopifyPreviewLoading(false);
    }
  }

  async function handleWordPressConnect() {
    setIsWordPressLoading(true);

    try {
      const response = await fetch("/api/integrations/wordpress/connect", {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; storeName?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not connect WordPress.");
      }

      setWordpressMessage(`Connected to ${payload.storeName ?? "the WordPress store"}.`);
      await loadWordPressStatus();
    } catch (error) {
      setWordpressMessage(
        error instanceof Error ? error.message : "Could not connect WordPress."
      );
    } finally {
      setIsWordPressLoading(false);
    }
  }

  async function handleWordPressPreview() {
    setIsWordPressPreviewLoading(true);

    try {
      const response = await fetch("/api/integrations/wordpress/store-truth-preview", {
        cache: "no-store",
      });
      const payload = (await response.json()) as WordPressStoreTruthPreview & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load WordPress preview.");
      }

      setWordpressPreview(payload);
    } catch (error) {
      setWordpressMessage(
        error instanceof Error ? error.message : "Could not load WordPress preview."
      );
    } finally {
      setIsWordPressPreviewLoading(false);
    }
  }

  async function handleRunSync(platform: "meta" | "shopify") {
    if (platform === "meta") {
      setIsMetaSyncRunning(true);
    } else {
      setIsShopifySyncRunning(true);
    }

    try {
      const response = await fetch("/api/sync/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform, clientId: activeClientId }),
      });
      const payload = (await response.json()) as { error?: string; notes?: string[] };

      if (!response.ok) {
        throw new Error(payload.error ?? "Sync run failed.");
      }

      setSyncMessage(payload.notes?.[0] ?? "Sync completed.");
      await loadSyncState();
      await loadMetaStatus();
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Could not run sync.");
    } finally {
      if (platform === "meta") {
        setIsMetaSyncRunning(false);
      } else {
        setIsShopifySyncRunning(false);
      }
    }
  }

  const metaReadyState = metaStatus?.connected
    ? metaStatus.accountFetchHealthy
      ? "Good"
      : "Watch"
    : metaStatus?.configured
    ? "Watch"
    : "Fix";
  const shopifyReadyState = shopifyStatus?.previewReady
    ? "Good"
    : shopifyStatus?.configured
    ? "Watch"
    : "Fix";
  const wordpressReadyState = wordpressStatus?.previewReady
    ? "Good"
    : wordpressStatus?.configured
    ? "Watch"
    : "Fix";

  return (
    <AppShell>
      <div className="space-y-5">
        <Section
          title="Client Onboarding"
          subtitle="Add a client first, then connect Meta and the right storefront truth source for that client."
        >
          <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold uppercase text-slate-400">Active Client</div>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    {isClientLoading ? "Loading clients" : activeClient?.name ?? "No client selected"}
                  </h3>
                </div>
                <StatusPill status={activeClient ? "Good" : "Watch"} />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MiniMetric
                  label="Website Type"
                  value={activeClient?.websitePlatform ?? "Not set"}
                  hint="Used to decide Shopify or WordPress onboarding next"
                  tone="warn"
                />
                <MiniMetric
                  label="Saved Clients"
                  value={`${clients.length}`}
                  hint="Each client keeps its own Meta account assignment"
                  tone="good"
                />
              </div>

              <div className="mt-4">
                <div className="text-xs font-black uppercase text-slate-400">Client Selector</div>
                <select
                  value={activeClientId}
                  onChange={(event) => setActiveClientId(event.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} · {client.websitePlatform}
                    </option>
                  ))}
                </select>
                {activeClient?.notes ? (
                  <p className="mt-3 text-sm text-slate-400">{activeClient.notes}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="text-sm font-bold uppercase text-slate-400">Add New Client</div>
              <div className="mt-4 grid gap-4">
                <input
                  value={clientNameDraft}
                  onChange={(event) => setClientNameDraft(event.target.value)}
                  placeholder="Client name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />
                <select
                  value={websitePlatformDraft}
                  onChange={(event) => setWebsitePlatformDraft(event.target.value as WebsitePlatform)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="shopify">Shopify</option>
                  <option value="wordpress">WordPress / WooCommerce</option>
                  <option value="salla">Salla</option>
                  <option value="wix">Wix</option>
                  <option value="custom">Other / Custom</option>
                </select>
                <textarea
                  value={clientNotesDraft}
                  onChange={(event) => setClientNotesDraft(event.target.value)}
                  placeholder="Optional notes"
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="mt-4 space-y-4">
                <MessageBox tone="info" message={clientMessage} />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleCreateClient()}
                  className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  {isCreatingClient ? "Creating Client" : "Create Client"}
                </button>
                <button
                  type="button"
                  onClick={() => void loadClients(activeClientId)}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Refresh Clients
                </button>
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Official API Onboarding"
          subtitle="Meta is the paid media source. Shopify and WordPress provide the store-truth layer for real validation."
        >
          <div className="grid gap-5 xl:grid-cols-3">
            <Surface
              eyebrow="Meta Marketing API"
              title={
                isMetaLoading
                  ? "Checking Meta setup"
                  : metaStatus?.connected
                  ? "Connected for this client"
                  : metaStatus?.configured
                  ? "Ready for developer-mode testing"
                  : "Needs official Meta app setup"
              }
              status={metaReadyState}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <MiniMetric
                  label="Client"
                  value={metaStatus?.client.name ?? activeClient?.name ?? "None"}
                  hint={metaStatus?.client.websitePlatform ?? activeClient?.websitePlatform ?? "Choose a client first"}
                  tone="good"
                />
                <MiniMetric
                  label="Selected Account"
                  value={metaStatus?.selectedAccount?.name ?? "Not selected"}
                  hint={metaStatus?.selectedAccountId ?? "Choose a Meta ad account"}
                  tone={metaStatus?.selectedAccount ? "good" : "default"}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-xs font-black uppercase text-slate-400">Callback URL</div>
                <div className="mt-2 break-all text-sm font-bold text-cyan-300">
                  {metaStatus?.callbackUrl ?? "/api/integrations/meta/callback"}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <EnvList values={metaStatus?.missingEnv ?? []} />
                <MessageBox message={metaStatus?.connectionError ?? null} />
                <MessageBox tone="info" message={metaMessage} />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={
                    activeClientId
                      ? `/api/integrations/meta/connect?clientId=${encodeURIComponent(activeClientId)}`
                      : "/admin"
                  }
                  className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  Connect Meta App
                </a>
                <button
                  type="button"
                  onClick={() => void loadMetaStatus()}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Refresh Status
                </button>
                <button
                  type="button"
                  onClick={() => void handleDisconnectMeta()}
                  className="rounded-xl border border-red-500/40 px-4 py-3 text-sm font-bold text-red-200 transition hover:border-red-400 hover:text-white"
                >
                  Disconnect
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="text-xs font-black uppercase text-slate-400">Account Selection</div>
                <select
                  value={accountDraft}
                  onChange={(event) => setAccountDraft(event.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Select a Meta ad account</option>
                  {(metaStatus?.accounts ?? []).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.id})
                    </option>
                  ))}
                </select>
                <p className="mt-3 text-xs text-slate-500">
                  Missing ad accounts usually means this Meta user does not have access to those accounts in Business Manager.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleAccountSelect()}
                    className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                  >
                    Save Account To Client
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleMetaPreview()}
                    className="rounded-xl border border-emerald-500/40 px-4 py-3 text-sm font-bold text-emerald-200 transition hover:border-emerald-400 hover:text-white"
                  >
                    {isMetaPreviewLoading ? "Loading Preview" : "Load Insights Preview"}
                  </button>
                </div>
              </div>
            </Surface>

            <Surface
              eyebrow="Shopify Truth"
              title={
                isShopifyLoading
                  ? "Checking Shopify setup"
                  : shopifyStatus?.previewReady
                  ? "Store truth preview is ready"
                  : shopifyStatus?.configured
                  ? "Ready for Shopify testing"
                  : "Needs Shopify credentials"
              }
              status={shopifyReadyState}
            >
              <MiniMetric
                label="Store Domain"
                value={shopifyStatus?.storeDomain || "Not configured"}
                hint={shopifyStatus?.recommendedNextStep ?? "Add Shopify app credentials"}
                tone={shopifyStatus?.storeDomain ? "good" : "default"}
              />
              <div className="mt-4 space-y-4">
                <EnvList values={shopifyStatus?.missingEnv ?? []} />
                <MessageBox message={shopifyStatus?.connectionError ?? null} />
                <MessageBox tone="info" message={shopifyMessage} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleShopifyConnect()}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                >
                  Connect Shopify
                </button>
                <button
                  type="button"
                  onClick={() => void handleShopifyPreview()}
                  className="rounded-xl border border-emerald-500/40 px-4 py-3 text-sm font-bold text-emerald-200 transition hover:border-emerald-400 hover:text-white"
                >
                  {isShopifyPreviewLoading ? "Loading Preview" : "Load Store Truth"}
                </button>
              </div>
            </Surface>

            <Surface
              eyebrow="WordPress Truth"
              title={
                isWordPressLoading
                  ? "Checking WordPress setup"
                  : wordpressStatus?.previewReady
                  ? "WordPress truth preview is ready"
                  : wordpressStatus?.configured
                  ? "Ready for WooCommerce testing"
                  : "Needs WooCommerce keys"
              }
              status={wordpressReadyState}
            >
              <MiniMetric
                label="Site URL"
                value={wordpressStatus?.siteUrl || "Not configured"}
                hint={wordpressStatus?.recommendedNextStep ?? "Add site URL and WooCommerce keys"}
                tone={wordpressStatus?.siteUrl ? "good" : "default"}
              />
              <div className="mt-4 space-y-4">
                <EnvList values={wordpressStatus?.missingEnv ?? []} />
                <MessageBox message={wordpressStatus?.connectionError ?? null} />
                <MessageBox tone="info" message={wordpressMessage} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleWordPressConnect()}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                >
                  Connect WordPress
                </button>
                <button
                  type="button"
                  onClick={() => void handleWordPressPreview()}
                  className="rounded-xl border border-emerald-500/40 px-4 py-3 text-sm font-bold text-emerald-200 transition hover:border-emerald-400 hover:text-white"
                >
                  {isWordPressPreviewLoading ? "Loading Preview" : "Load Store Truth"}
                </button>
              </div>
            </Surface>
          </div>
        </Section>

        <Section
          title="Readiness Snapshot"
          subtitle="The decision engine should trust scaling only when Meta and store truth are both ready."
        >
          <div className="grid gap-4 md:grid-cols-5">
            <MiniMetric
              label="Meta Status"
              value={metaStatus?.connected ? "Connected" : "Pending"}
              hint={metaStatus?.recommendedNextStep ?? "Connect Meta first"}
              tone={metaStatus?.connected ? (metaStatus.accountFetchHealthy ? "good" : "warn") : "warn"}
            />
            <MiniMetric
              label="Shopify"
              value={shopifyStatus?.previewReady ? "Preview Ready" : "Pending"}
              hint={shopifyStatus?.recommendedNextStep ?? "Add Shopify credentials"}
              tone={shopifyStatus?.previewReady ? "good" : "warn"}
            />
            <MiniMetric
              label="WordPress"
              value={wordpressStatus?.previewReady ? "Preview Ready" : "Pending"}
              hint={wordpressStatus?.recommendedNextStep ?? "Add WooCommerce keys"}
              tone={wordpressStatus?.previewReady ? "good" : "warn"}
            />
            <MiniMetric
              label="Decision Trust"
              value={
                metaStatus?.connected &&
                (shopifyStatus?.previewReady || wordpressStatus?.previewReady)
                  ? "Pair Ready"
                  : "Blocked"
              }
              hint="Real scaling needs platform plus business-truth agreement"
              tone={
                metaStatus?.connected &&
                (shopifyStatus?.previewReady || wordpressStatus?.previewReady)
                  ? "good"
                  : "bad"
              }
            />
            <MiniMetric
              label="Mode"
              value="Developer First"
              hint="Keep testing in developer mode until flows are proven"
              tone="warn"
            />
          </div>
        </Section>

        <div className="grid gap-5 xl:grid-cols-3">
          <Section title="Meta Preview" subtitle="Quick live sample from the selected Meta ad account.">
            {metaInsights ? (
              <div className="grid gap-4 md:grid-cols-2">
                <MiniMetric label="Spend" value={`$${metaInsights.totals.spend.toFixed(0)}`} tone="warn" />
                <MiniMetric label="Purchases" value={`${metaInsights.totals.purchases}`} tone="good" />
                <MiniMetric label="Revenue" value={`$${metaInsights.totals.purchaseValue.toFixed(0)}`} tone="good" />
                <MiniMetric label="Clicks" value={`${metaInsights.totals.clicks}`} tone="default" />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-5 text-sm text-slate-400">
                No Meta preview loaded yet for this client.
              </div>
            )}
          </Section>

          <Section title="Shopify Preview" subtitle="Store-truth snapshot from Shopify.">
            {shopifyPreview ? (
              <div className="grid gap-4 md:grid-cols-2">
                <MiniMetric label="Gross Sales" value={`${shopifyPreview.snapshot.currencyCode} ${shopifyPreview.snapshot.grossSales.toFixed(0)}`} tone="good" />
                <MiniMetric label="Net Sales" value={`${shopifyPreview.snapshot.currencyCode} ${shopifyPreview.snapshot.netSales.toFixed(0)}`} tone="good" />
                <MiniMetric label="Orders" value={`${shopifyPreview.snapshot.ordersCount}`} tone="default" />
                <MiniMetric label="AOV" value={`${shopifyPreview.snapshot.currencyCode} ${shopifyPreview.snapshot.averageOrderValue.toFixed(0)}`} tone="warn" />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-5 text-sm text-slate-400">
                No Shopify preview loaded yet.
              </div>
            )}
          </Section>

          <Section title="WordPress Preview" subtitle="Store-truth snapshot from WooCommerce.">
            {wordpressPreview ? (
              <div className="grid gap-4 md:grid-cols-2">
                <MiniMetric label="Gross Sales" value={`${wordpressPreview.snapshot.currencyCode} ${wordpressPreview.snapshot.grossSales.toFixed(0)}`} tone="good" />
                <MiniMetric label="Net Sales" value={`${wordpressPreview.snapshot.currencyCode} ${wordpressPreview.snapshot.netSales.toFixed(0)}`} tone="good" />
                <MiniMetric label="Orders" value={`${wordpressPreview.snapshot.ordersCount}`} tone="default" />
                <MiniMetric label="AOV" value={`${wordpressPreview.snapshot.currencyCode} ${wordpressPreview.snapshot.averageOrderValue.toFixed(0)}`} tone="warn" />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-5 text-sm text-slate-400">
                No WordPress preview loaded yet.
              </div>
            )}
          </Section>
        </div>

        <Section
          title="Sync History"
          subtitle="Prototype persistence now records runs and snapshots while we wait for a real database."
        >
          <div className="grid gap-5 xl:grid-cols-[0.9fr,1.1fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex items-center gap-3 text-blue-300">
                <Database size={18} />
                <div className="text-sm font-black uppercase">Persistence Mode</div>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                {syncState?.note ?? "This is still temporary storage, but it is enough to test the real workflow."}
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MiniMetric label="Connections" value={`${syncState?.connections.length ?? 0}`} hint="Stored per-platform records" tone="good" />
                <MiniMetric label="Sync Runs" value={`${syncState?.syncRuns.length ?? 0}`} hint={syncState?.updatedAt ?? "No sync history yet"} tone="warn" />
              </div>
              <div className="mt-4 space-y-4">
                <MessageBox tone="info" message={syncMessage} />
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-400">
                  Storage path: {syncState?.storage.filePath ?? "Not loaded yet"}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleRunSync("meta")}
                  className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  {isMetaSyncRunning ? "Running Meta Sync" : "Run Meta Sync"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleRunSync("shopify")}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                >
                  {isShopifySyncRunning ? "Running Shopify Sync" : "Run Shopify Sync"}
                </button>
                <button
                  type="button"
                  onClick={() => void loadSyncState()}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Refresh Sync State
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                <div className="flex items-center gap-3 text-cyan-300">
                  <Workflow size={18} />
                  <div className="text-sm font-black uppercase">Recent Runs</div>
                </div>
                <div className="mt-4 space-y-3">
                  {(syncState?.syncRuns.length ?? 0) > 0 ? (
                    syncState?.syncRuns.slice(0, 5).map((run) => (
                      <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm font-black uppercase text-white">
                            {run.clientName ? `${run.clientName} · ` : ""}
                            {run.platform} · {run.status}
                          </div>
                          <div className="text-xs text-slate-400">
                            {run.finishedAt ?? run.startedAt ?? "No timestamp"}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-slate-300">
                          {run.error ?? run.notes[0] ?? "No notes recorded yet."}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-5 text-sm text-slate-400">
                      No sync runs recorded yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                  <div className="text-sm font-bold uppercase text-slate-400">Latest Media Snapshot</div>
                  {syncState?.mediaSnapshots[0] ? (
                    <div className="mt-4 space-y-2 text-sm text-slate-300">
                      <p><span className="text-slate-500">Client:</span> {syncState.mediaSnapshots[0].clientName}</p>
                      <p><span className="text-slate-500">Platform:</span> {syncState.mediaSnapshots[0].platform}</p>
                      <p><span className="text-slate-500">Account:</span> {syncState.mediaSnapshots[0].accountLabel}</p>
                      <p><span className="text-slate-500">Spend:</span> ${syncState.mediaSnapshots[0].spend.toFixed(0)}</p>
                      <p><span className="text-slate-500">Revenue:</span> ${syncState.mediaSnapshots[0].purchaseValue.toFixed(0)}</p>
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-slate-400">No stored Meta snapshot yet.</div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                  <div className="text-sm font-bold uppercase text-slate-400">Latest Business Truth</div>
                  {syncState?.businessTruthSnapshots[0] ? (
                    <div className="mt-4 space-y-2 text-sm text-slate-300">
                      <p><span className="text-slate-500">Client:</span> {syncState.businessTruthSnapshots[0].clientName}</p>
                      <p><span className="text-slate-500">Source:</span> {syncState.businessTruthSnapshots[0].source}</p>
                      <p><span className="text-slate-500">Net Sales:</span> ${syncState.businessTruthSnapshots[0].netSales.toFixed(0)}</p>
                      <p><span className="text-slate-500">Orders:</span> {syncState.businessTruthSnapshots[0].orders}</p>
                      <p><span className="text-slate-500">AOV:</span> ${syncState.businessTruthSnapshots[0].averageOrderValue.toFixed(0)}</p>
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-slate-400">No stored storefront truth snapshot yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="What Comes Next"
          subtitle="This gets the product into a real onboarding shape, but a few steps still remain before it is fully finished."
        >
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex items-center gap-3 text-cyan-300">
                <Plug size={18} />
                <div className="text-sm font-black uppercase">Connections</div>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Each client now has a place to live in admin, and Meta can be attached per client instead of per browser session.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex items-center gap-3 text-emerald-300">
                <Store size={18} />
                <div className="text-sm font-black uppercase">Truth Layer</div>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Shopify and WordPress still need to become client-scoped next, just like Meta is now.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex items-center gap-3 text-amber-300">
                <ShieldCheck size={18} />
                <div className="text-sm font-black uppercase">Validation</div>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                The next serious step is replacing temporary storage with a real database so tokens, sync runs, and client assignments survive reliably.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
