"use client";

import { useEffect, useMemo, useState } from "react";
import { Workflow } from "lucide-react";
import { AppShell, MiniMetric, Section, StatusPill } from "@/components/AppShell";
import {
  getCurrencyMeta,
  SUPPORTED_CLIENT_CURRENCIES,
  type ClientCurrencyCode,
  type ClientRecord,
  type WebsitePlatform,
} from "@/lib/clientTypes";

type ClientDirectoryResponse = {
  clients: ClientRecord[];
  activeClientId: string;
  storage: {
    storageMode: "vercel_kv" | "ephemeral_tmp";
    location: string;
    durable: boolean;
  };
};

type MetaAccountOption = {
  id: string;
  name: string;
  currency?: string;
};

type MetaStatus = {
  client: ClientRecord;
  configured: boolean;
  connected: boolean;
  accountFetchHealthy: boolean;
  appMode: string;
  scopes: string[];
  callbackUrl: string;
  missingEnv: string[];
  selectedAccountId: string | null;
  selectedAccount: MetaAccountOption | null;
  accounts: MetaAccountOption[];
  connectionError: string | null;
  syncReady: boolean;
  recommendedNextStep: string;
};

type MetaInsightsPreview = {
  totals: {
    spend: number;
    purchases: number;
    purchaseValue: number;
  };
  note: string;
};

type ShopifyStatus = {
  client: ClientRecord;
  configured: boolean;
  connected: boolean;
  previewReady: boolean;
  storeDomain: string;
  shopName: string | null;
  missingEnv: string[];
  connectionError: string | null;
  recommendedNextStep: string;
};

type WordPressStatus = {
  configured: boolean;
  connected: boolean;
  previewReady: boolean;
  siteUrl: string;
  missingEnv: string[];
  connectionError: string | null;
  recommendedNextStep: string;
};

type SyncStateResponse = {
  syncRuns: Array<{
    id: string;
    clientName: string | null;
    platform: string;
    status: string;
    finishedAt: string | null;
    notes: string[];
  }>;
  storage: {
    location: string;
    storageMode: "vercel_kv" | "ephemeral_tmp";
    durable: boolean;
  };
  note: string;
};

function Notice({
  message,
  tone = "info",
}: {
  message: string | null;
  tone?: "info" | "warn";
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

function MissingEnv({ values }: { values: string[] }) {
  if (!values.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4">
      <div className="text-sm font-black uppercase text-red-300">
        Missing Environment Values
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-full bg-red-950/60 px-3 py-1 text-xs font-bold text-red-200"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [activeClientId, setActiveClientId] = useState("");
  const [clientNameDraft, setClientNameDraft] = useState("");
  const [websitePlatformDraft, setWebsitePlatformDraft] =
    useState<WebsitePlatform>("shopify");
  const [currencyCodeDraft, setCurrencyCodeDraft] =
    useState<ClientCurrencyCode>("USD");
  const [notesDraft, setNotesDraft] = useState("");
  const [clientStorage, setClientStorage] =
    useState<ClientDirectoryResponse["storage"] | null>(null);
  const [clientMessage, setClientMessage] = useState<string | null>(null);
  const [metaMessage, setMetaMessage] = useState<string | null>(null);
  const [shopifyMessage, setShopifyMessage] = useState<string | null>(null);
  const [wordpressMessage, setWordpressMessage] = useState<string | null>(null);
  const [accountDraft, setAccountDraft] = useState("");
  const [shopifyStoreDomainDraft, setShopifyStoreDomainDraft] = useState("");
  const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null);
  const [metaPreview, setMetaPreview] = useState<MetaInsightsPreview | null>(null);
  const [shopifyStatus, setShopifyStatus] = useState<ShopifyStatus | null>(null);
  const [wordpressStatus, setWordpressStatus] = useState<WordPressStatus | null>(
    null
  );
  const [syncState, setSyncState] = useState<SyncStateResponse | null>(null);

  const activeClient = useMemo(
    () =>
      clients.find((client) => client.id === activeClientId) ?? clients[0] ?? null,
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
    setActiveClientId(nextClientId);
    setClientStorage(payload.storage);
    window.localStorage.setItem("media-dashboard-active-client", nextClientId);
  }

  async function loadMetaStatus(clientId: string) {
    const response = await fetch(
      `/api/integrations/meta/status?clientId=${encodeURIComponent(clientId)}`,
      {
        cache: "no-store",
      }
    );
    const payload = (await response.json()) as MetaStatus;
    setMetaStatus(payload);
    setAccountDraft(payload.selectedAccountId ?? payload.accounts[0]?.id ?? "");
  }

  async function loadShopifyStatus(clientId: string) {
    const response = await fetch(
      `/api/integrations/shopify/status?clientId=${encodeURIComponent(clientId)}`,
      {
        cache: "no-store",
      }
    );
    const payload = (await response.json()) as ShopifyStatus;
    setShopifyStatus(payload);
    setShopifyStoreDomainDraft(payload.storeDomain ?? "");
  }

  async function loadReadiness() {
    const [wordpressResponse, syncResponse] = await Promise.all([
      fetch("/api/integrations/wordpress/status", { cache: "no-store" }),
      fetch("/api/sync/state", { cache: "no-store" }),
    ]);

    setWordpressStatus((await wordpressResponse.json()) as WordPressStatus);
    setSyncState((await syncResponse.json()) as SyncStateResponse);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preferredClientId =
      params.get("clientId") ??
      window.localStorage.getItem("media-dashboard-active-client");

    void loadClients(preferredClientId)
      .then(() => loadReadiness())
      .catch(() => setClientMessage("Could not load the admin state."));

    const metaConnected = params.get("meta_connected");
    const metaError = params.get("meta_error");
    const shopifyConnected = params.get("shopify_connected");
    const shopifyError = params.get("shopify_error");

    if (metaConnected === "1") {
      setMetaMessage("Meta connected. Choose the ad account you want to save to this client.");
    } else if (metaError) {
      setMetaMessage(decodeURIComponent(metaError));
    }

    if (shopifyConnected === "1") {
      setShopifyMessage(
        "Shopify connected. The store owner approved access for this client store."
      );
    } else if (shopifyError) {
      setShopifyMessage(decodeURIComponent(shopifyError));
    }
  }, []);

  useEffect(() => {
    if (!activeClientId) {
      return;
    }

    void Promise.all([
      loadMetaStatus(activeClientId),
      loadShopifyStatus(activeClientId),
    ]).catch(() => {
      setMetaMessage("Could not load integration status.");
    });
  }, [activeClientId]);

  function handleClientSelection(nextClientId: string) {
    setActiveClientId(nextClientId);
    window.localStorage.setItem("media-dashboard-active-client", nextClientId);
    const url = new URL(window.location.href);
    url.searchParams.set("clientId", nextClientId);
    window.history.replaceState({}, "", url.toString());
  }

  async function handleCreateClient() {
    const trimmedName = clientNameDraft.trim();

    if (!trimmedName) {
      setClientMessage("Client name is required.");
      return;
    }

    const response = await fetch("/api/admin/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: trimmedName,
        websitePlatform: websitePlatformDraft,
        currencyCode: currencyCodeDraft,
        notes: notesDraft,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      client?: ClientRecord;
    };

    if (!response.ok || !payload.client) {
      setClientMessage(payload.error ?? "Could not create the client.");
      return;
    }

    setClientNameDraft("");
    setNotesDraft("");
    setCurrencyCodeDraft("USD");
    await loadClients(payload.client.id);
    setClientMessage(
      `${payload.client.name} created with ${getCurrencyMeta(
        payload.client.currencyCode
      ).label}.`
    );
    setMetaMessage("Client created. You can now connect Meta for this client.");
    setShopifyMessage("Client created. You can now connect Shopify for this client.");
  }

  async function handleDeleteClient() {
    if (!activeClient) {
      setClientMessage("Choose a client first.");
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${activeClient.name}? This will also remove its saved Meta connection for this client.`
    );

    if (!shouldDelete) {
      return;
    }

    const response = await fetch(
      `/api/admin/clients?clientId=${encodeURIComponent(activeClient.id)}`,
      {
        method: "DELETE",
      }
    );

    const payload = (await response.json()) as {
      error?: string;
      clients?: ClientRecord[];
      activeClientId?: string;
      deletedClientId?: string;
    };

    if (!response.ok) {
      setClientMessage(payload.error ?? "Could not delete the client.");
      return;
    }

    const nextClientId = payload.activeClientId ?? payload.clients?.[0]?.id ?? "";
    setMetaPreview(null);
    await loadClients(nextClientId);
    setMetaMessage(null);
    setShopifyMessage(null);
    setClientMessage(`${activeClient.name} was removed from the dashboard.`);
  }

  async function handleSaveMetaAccount() {
    if (!accountDraft) {
      setMetaMessage("Choose a Meta ad account first.");
      return;
    }

    const response = await fetch("/api/integrations/meta/account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId: accountDraft,
        clientId: activeClientId,
      }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMetaMessage(payload.error ?? "Could not save the Meta ad account.");
      return;
    }

    await loadMetaStatus(activeClientId);
    setMetaMessage(
      `Saved this Meta ad account to ${activeClient?.name ?? "the selected client"}.`
    );
  }

  async function handleDisconnectMeta() {
    const response = await fetch(
      `/api/integrations/meta/status?clientId=${encodeURIComponent(activeClientId)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      setMetaMessage("Could not disconnect Meta.");
      return;
    }

    setMetaPreview(null);
    await loadMetaStatus(activeClientId);
    setMetaMessage("Meta was disconnected for this client.");
  }

  async function handleLoadMetaPreview() {
    const response = await fetch(
      `/api/integrations/meta/insights-preview?clientId=${encodeURIComponent(activeClientId)}`,
      {
        cache: "no-store",
      }
    );
    const payload = (await response.json()) as MetaInsightsPreview & {
      error?: string;
    };

    if (!response.ok) {
      setMetaMessage(payload.error ?? "Could not load the Meta preview.");
      return;
    }

    setMetaPreview(payload);
  }

  function handleConnectShopify() {
    const storeDomain = shopifyStoreDomainDraft.trim();

    if (!storeDomain) {
      setShopifyMessage("Enter the Shopify store domain first.");
      return;
    }

    const params = new URLSearchParams({
      clientId: activeClientId,
      storeDomain,
    });

    window.location.href = `/api/integrations/shopify/connect?${params.toString()}`;
  }

  async function handleDisconnectShopify() {
    const response = await fetch(
      `/api/integrations/shopify/status?clientId=${encodeURIComponent(activeClientId)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      setShopifyMessage("Could not disconnect Shopify.");
      return;
    }

    await loadShopifyStatus(activeClientId);
    setShopifyMessage("Shopify was disconnected for this client.");
  }

  const metaReadyState = metaStatus?.connected ? "Good" : metaStatus?.configured ? "Watch" : "Fix";
  const shopifyReadyState = shopifyStatus?.previewReady ? "Good" : shopifyStatus?.configured ? "Watch" : "Fix";
  const wordpressReadyState = wordpressStatus?.previewReady ? "Good" : wordpressStatus?.configured ? "Watch" : "Fix";

  return (
    <AppShell>
      <div className="space-y-5">
        <Notice
          message={
            clientStorage
              ? clientStorage.durable
                ? `Client storage is durable now. Data is stored through ${clientStorage.location}, so refreshes and future deployments should not wipe your clients.`
                : `Client storage is still temporary right now. It is using ${clientStorage.location}, which can reset after refreshes or deployments until durable storage is configured.`
              : null
          }
          tone={clientStorage?.durable ? "info" : "warn"}
        />

        <Section
          title="Client Onboarding"
          subtitle="Create a client first, choose the website type, and set the main reporting currency."
        >
          <div className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black uppercase text-slate-400">
                    Active Client
                  </div>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    {activeClient?.name ?? "No client selected"}
                  </h3>
                </div>
                <StatusPill status={activeClient ? "Good" : "Watch"} />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MiniMetric
                  label="Website Type"
                  value={activeClient?.websitePlatform ?? "Not set"}
                  hint="Used to decide which truth source connects next."
                  tone="warn"
                />
                <MiniMetric
                  label="Client Currency"
                  value={
                    activeClient
                      ? getCurrencyMeta(activeClient.currencyCode).label
                      : "Not set"
                  }
                  hint="This is the client reporting currency across the dashboard."
                  tone="good"
                />
                <MiniMetric
                  label="Saved Clients"
                  value={`${clients.length}`}
                  hint="Each client keeps its own Meta and Shopify connection state."
                  tone="good"
                />
                <MiniMetric
                  label="Meta State"
                  value={metaStatus?.connected ? "Connected" : "Pending"}
                  hint={metaStatus?.recommendedNextStep ?? "Connect Meta for this client"}
                  tone={metaStatus?.connected ? "good" : "warn"}
                />
              </div>

              <div className="mt-4">
                <div className="text-xs font-black uppercase text-slate-400">
                  Client Selector
                </div>
                <select
                  value={activeClientId}
                  onChange={(event) => handleClientSelection(event.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} · {client.websitePlatform} · {client.currencyCode}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="text-sm font-black uppercase text-slate-400">
                Add New Client
              </div>
              <div className="mt-4 grid gap-4">
                <input
                  value={clientNameDraft}
                  onChange={(event) => setClientNameDraft(event.target.value)}
                  placeholder="Client name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />
                <select
                  value={websitePlatformDraft}
                  onChange={(event) =>
                    setWebsitePlatformDraft(event.target.value as WebsitePlatform)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="shopify">Shopify</option>
                  <option value="wordpress">WordPress / WooCommerce</option>
                  <option value="salla">Salla</option>
                  <option value="wix">Wix</option>
                  <option value="custom">Other / Custom</option>
                </select>
                <select
                  value={currencyCodeDraft}
                  onChange={(event) =>
                    setCurrencyCodeDraft(event.target.value as ClientCurrencyCode)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  {SUPPORTED_CLIENT_CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  rows={3}
                  placeholder="Optional notes"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="mt-4 space-y-4">
                <Notice message={clientMessage} />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleCreateClient()}
                  className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  Create Client
                </button>
                <button
                  type="button"
                  onClick={() => void loadClients(activeClientId)}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  Refresh Clients
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteClient()}
                  className="rounded-xl border border-red-500/40 px-4 py-3 text-sm font-bold text-red-200 transition hover:border-red-400 hover:text-white"
                >
                  Delete Active Client
                </button>
              </div>
            </div>
          </div>
        </Section>

        <div className="grid gap-5 xl:grid-cols-3">
          <Section
            title="Meta Connection"
            subtitle="Use the official Meta app flow, then save the correct ad account to the active client."
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black uppercase text-slate-400">
                  Current State
                </div>
                <div className="mt-2 text-2xl font-black text-white">
                  {metaStatus?.connected
                    ? "Connected for this client"
                    : "Needs connection"}
                </div>
              </div>
              <StatusPill status={metaReadyState} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <MiniMetric
                label="Client"
                value={metaStatus?.client.name ?? activeClient?.name ?? "None"}
                hint={
                  metaStatus?.client.currencyCode
                    ? getCurrencyMeta(metaStatus.client.currencyCode).label
                    : "Choose a client first"
                }
                tone="good"
              />
              <MiniMetric
                label="Selected Account"
                value={metaStatus?.selectedAccount?.name ?? "Not selected"}
                hint={metaStatus?.selectedAccountId ?? "Save an ad account to this client"}
                tone={metaStatus?.selectedAccount ? "good" : "warn"}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
              <div className="font-black uppercase text-slate-400">Callback URL</div>
              <div className="mt-2 break-all text-cyan-300">
                {metaStatus?.callbackUrl ?? "/api/integrations/meta/callback"}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <MissingEnv values={metaStatus?.missingEnv ?? []} />
              <Notice message={metaStatus?.connectionError ?? null} tone="warn" />
              <Notice message={metaMessage} />
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
                {metaStatus?.connected ? "Reconnect Meta App" : "Connect Meta App"}
              </a>
              <button
                type="button"
                onClick={() => void loadMetaStatus(activeClientId)}
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

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="text-xs font-black uppercase text-slate-400">
                Save Account To Client
              </div>
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

              <div className="mt-3 text-xs text-slate-500">
                If some ad accounts are missing, the connected Meta user usually
                does not have access to them in Business Manager.
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSaveMetaAccount()}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
                >
                  {metaStatus?.selectedAccountId === accountDraft
                    ? "Saved To Client"
                    : "Save Account To Client"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleLoadMetaPreview()}
                  className="rounded-xl border border-emerald-500/40 px-4 py-3 text-sm font-bold text-emerald-200 transition hover:border-emerald-400 hover:text-white"
                >
                  Load Insights Preview
                </button>
              </div>
            </div>
          </Section>

          <Section
            title="Storefront Truth"
            subtitle="Shopify and WordPress remain the first storefront types we support."
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-white">Shopify</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {shopifyStatus?.recommendedNextStep ?? "Checking Shopify status"}
                    </div>
                  </div>
                  <StatusPill status={shopifyReadyState} />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <MiniMetric
                    label="Client"
                    value={shopifyStatus?.client.name ?? activeClient?.name ?? "None"}
                    hint="Shopify is now connected per client through store-owner approval."
                    tone="good"
                  />
                  <MiniMetric
                    label="Connected Store"
                    value={shopifyStatus?.shopName ?? "Not connected"}
                    hint={shopifyStatus?.storeDomain ?? "Start the Shopify install flow for this client"}
                    tone={shopifyStatus?.connected ? "good" : "warn"}
                  />
                </div>

                <div className="mt-3 space-y-3">
                  <MissingEnv values={shopifyStatus?.missingEnv ?? []} />
                  <Notice
                    message={shopifyStatus?.connectionError ?? null}
                    tone="warn"
                  />
                  <Notice message={shopifyMessage} />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="text-xs font-black uppercase text-slate-400">
                    Install Store To Client
                  </div>
                  <input
                    value={shopifyStoreDomainDraft}
                    onChange={(event) => setShopifyStoreDomainDraft(event.target.value)}
                    placeholder="your-store.myshopify.com"
                    className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <div className="mt-3 text-xs text-slate-500">
                    This opens Shopify&apos;s approval screen so the store owner can install and approve access for this client store.
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleConnectShopify}
                      className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                    >
                      {shopifyStatus?.connected ? "Reconnect Shopify" : "Connect Shopify"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadShopifyStatus(activeClientId)}
                      className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:text-white"
                    >
                      Refresh Status
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDisconnectShopify()}
                      className="rounded-xl border border-red-500/40 px-4 py-3 text-sm font-bold text-red-200 transition hover:border-red-400 hover:text-white"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-white">WordPress / WooCommerce</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {wordpressStatus?.recommendedNextStep ??
                        "Checking WordPress status"}
                    </div>
                  </div>
                  <StatusPill status={wordpressReadyState} />
                </div>
                <div className="mt-3 space-y-3">
                  <MissingEnv values={wordpressStatus?.missingEnv ?? []} />
                  <Notice
                    message={wordpressStatus?.connectionError ?? wordpressMessage}
                    tone="warn"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
                The dashboard should keep the client&apos;s website currency as the
                main truth. When a platform later reports in a different currency,
                like Snapchat using only dollars, we will convert underneath that
                layer rather than change the client currency itself.
              </div>
            </div>
          </Section>

          <Section
            title="Preview And Sync"
            subtitle="Quick checks while the real database layer is still the next step."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <MiniMetric
                label="Meta Preview Spend"
                value={
                  metaPreview && metaStatus?.selectedAccount?.currency
                    ? `${metaStatus.selectedAccount.currency} ${metaPreview.totals.spend.toFixed(0)}`
                    : "Waiting"
                }
                hint="Live Meta preview"
                tone={metaPreview ? "good" : "warn"}
              />
              <MiniMetric
                label="Meta Preview Revenue"
                value={
                  metaPreview && metaStatus?.selectedAccount?.currency
                    ? `${metaStatus.selectedAccount.currency} ${metaPreview.totals.purchaseValue.toFixed(0)}`
                    : "Waiting"
                }
                hint="Platform-attributed value"
                tone={metaPreview ? "good" : "warn"}
              />
              <MiniMetric
                label="Sync Storage"
                value={syncState?.storage.storageMode ?? "Not loaded"}
                hint={syncState?.storage.location ?? "Storage location pending"}
                tone={syncState?.storage.durable ? "good" : "warn"}
              />
              <MiniMetric
                label="Recent Runs"
                value={`${syncState?.syncRuns.length ?? 0}`}
                hint={syncState?.note ?? "Sync history loading"}
                tone="good"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-cyan-300">
                <Workflow size={16} />
                <div className="font-black">Latest Sync Notes</div>
              </div>
              <div className="mt-3 space-y-3 text-sm text-slate-300">
                {(syncState?.syncRuns ?? []).slice(0, 3).map((run) => (
                  <div key={run.id} className="rounded-xl bg-slate-900/60 p-3">
                    <div className="font-bold text-white">
                      {run.clientName ? `${run.clientName} · ` : ""}
                      {run.platform} · {run.status}
                    </div>
                    <div className="mt-1 text-slate-400">
                      {run.notes[0] ?? run.finishedAt ?? "No notes yet"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>

        <Section
          title="What This Solves"
          subtitle="These are the UX fixes included in this admin pass."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MiniMetric
              label="Save Feedback"
              value="Added"
              hint="Saving the Meta account now shows a clear success message."
              tone="good"
            />
            <MiniMetric
              label="Meta Button"
              value={metaStatus?.connected ? "Reconnect shown" : "Connect shown"}
              hint="The label now changes once Meta is connected."
              tone="good"
            />
            <MiniMetric
              label="Client Currency"
              value={activeClient?.currencyCode ?? "USD"}
              hint="USD, AED, SAR, and EGP are available now."
              tone="good"
            />
            <MiniMetric
              label="Client Scope"
              value="Per client"
              hint="Meta and Shopify connections are now tied to the chosen client."
              tone="good"
            />
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
