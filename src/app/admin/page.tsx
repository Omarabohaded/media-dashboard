"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell, StatusPill } from "@/components/AppShell";
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

type ConnectionTone = "connected" | "needs-action" | "not-connected" | "optional" | "planned";

type ConnectionItem = {
  id: string;
  name: string;
  status: string;
  tone: ConnectionTone;
  context: string;
  nextAction: string;
  actionHref?: string;
  actionLabel?: string;
  targetId?: string;
};

const fieldClass =
  "w-full rounded-[12px] border border-[var(--line)] bg-white/75 px-3 py-2.5 text-sm font-medium text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-white";
const primaryButtonClass =
  "rounded-[12px] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90";
const secondaryButtonClass =
  "rounded-[12px] border border-[var(--line)] bg-white/62 px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:bg-white";
const dangerButtonClass =
  "rounded-[12px] border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 transition hover:border-rose-400 hover:bg-rose-100";
const warningButtonClass =
  "rounded-[12px] border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-100";

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
      ? "border-cyan-200 bg-cyan-50 text-cyan-950"
      : "border-amber-200 bg-amber-50 text-amber-950";

  return <div className={`rounded-[14px] border px-3 py-2.5 text-sm ${styles}`}>{message}</div>;
}

function MissingEnv({ values }: { values: string[] }) {
  if (!values.length) {
    return null;
  }

  return (
    <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-800">
        Missing Environment Values
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-full border border-rose-200 bg-white/75 px-2.5 py-1 text-xs font-semibold text-rose-800"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function AdminPanel({
  title,
  eyebrow,
  description,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-[var(--line)] bg-white/58 p-4 shadow-[0_12px_30px_rgba(20,34,24,0.05)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--ink)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function AdminBlock({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-[var(--line)] bg-white/52 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--ink)]">{title}</div>
          {description ? (
            <div className="mt-1 text-sm leading-5 text-[var(--muted)]">{description}</div>
          ) : null}
        </div>
        {action}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function AdminStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[14px] border border-[var(--line)] bg-white/45 px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold leading-6 text-[var(--ink)]">{value}</div>
      {hint ? <div className="mt-1 text-xs leading-5 text-[var(--muted)]">{hint}</div> : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </div>
      <div className="max-w-full text-right text-sm font-medium text-[var(--ink)]">{value}</div>
    </div>
  );
}

function MetaAccountSearchPicker({
  accounts,
  selectedAccountId,
  searchValue,
  onSearchChange,
  onSelect,
}: {
  accounts: MetaAccountOption[];
  selectedAccountId: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelect: (accountId: string) => void;
}) {
  const normalizedSearch = searchValue.trim().toLowerCase();
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? null;
  const filteredAccounts = useMemo(() => {
    if (!normalizedSearch) {
      return accounts;
    }

    return accounts.filter((account) => {
      const accountText = `${account.name} ${account.id} ${account.currency ?? ""}`.toLowerCase();
      return accountText.includes(normalizedSearch);
    });
  }, [accounts, normalizedSearch]);

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Search by account name or ID
        </span>
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Type account name, ID, or currency"
          className={`mt-2 ${fieldClass}`}
        />
      </label>

      {selectedAccount ? (
        <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
            Selected for this client
          </div>
          <div className="mt-1 font-semibold text-[var(--ink)]">{selectedAccount.name}</div>
          <div className="mt-1 text-xs text-emerald-900">
            {selectedAccount.id}
            {selectedAccount.currency ? ` · ${selectedAccount.currency}` : ""}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[14px] border border-[var(--line)] bg-white/48">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]">
          <span>
            {filteredAccounts.length} of {accounts.length} accounts
          </span>
          {searchValue ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="font-semibold text-[var(--accent)] transition hover:opacity-80"
            >
              Clear search
            </button>
          ) : null}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {!accounts.length ? (
            <div className="px-3 py-4 text-sm text-[var(--muted)]">
              Connect Meta first so available ad accounts can load here.
            </div>
          ) : !filteredAccounts.length ? (
            <div className="px-3 py-4 text-sm text-[var(--muted)]">
              No ad accounts match this search. Try the account name or the numeric ID.
            </div>
          ) : (
            filteredAccounts.map((account) => {
              const isSelected = account.id === selectedAccountId;

              return (
                <button
                  type="button"
                  key={account.id}
                  onClick={() => onSelect(account.id)}
                  className={`block w-full border-b border-[var(--line)] px-3 py-3 text-left text-sm transition last:border-b-0 ${
                    isSelected
                      ? "bg-emerald-50 text-[var(--ink)]"
                      : "text-[var(--ink)] hover:bg-white/75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{account.name}</div>
                      <div className="mt-1 break-all text-xs text-[var(--muted)]">
                        {account.id}
                        {account.currency ? ` · ${account.currency}` : ""}
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-900">
                        Selected
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function connectionCardToneClass(tone: ConnectionTone) {
  if (tone === "connected") {
    return "border-emerald-200 bg-emerald-50/85";
  }
  if (tone === "optional") {
    return "border-amber-200 bg-amber-50/80";
  }
  if (tone === "needs-action") {
    return "border-orange-200 bg-orange-50/80";
  }
  if (tone === "planned") {
    return "border-slate-200 bg-slate-50/80";
  }

  return "border-[var(--line)] bg-white/62";
}

function connectionStatusPillClass(tone: ConnectionTone) {
  if (tone === "connected") {
    return "border-emerald-200 bg-white/80 text-emerald-900";
  }
  if (tone === "optional") {
    return "border-amber-200 bg-white/80 text-amber-900";
  }
  if (tone === "needs-action") {
    return "border-orange-200 bg-white/80 text-orange-900";
  }
  if (tone === "planned") {
    return "border-slate-200 bg-white/80 text-slate-700";
  }

  return "border-[var(--line)] bg-white/80 text-[var(--muted)]";
}

function ConnectionOverviewCard({ item }: { item: ConnectionItem }) {
  const content = (
    <div
      className={`group flex h-full flex-col rounded-[16px] border p-3.5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(20,34,24,0.07)] ${connectionCardToneClass(
        item.tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--ink)]">{item.name}</div>
          <div className="mt-1 truncate text-xs text-[var(--muted)]">{item.context}</div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${connectionStatusPillClass(
            item.tone
          )}`}
        >
          {item.status}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-black/5 pt-3">
        <div className="text-xs leading-5 text-[var(--muted)]">{item.nextAction}</div>
        {item.actionLabel ? (
          <span className="shrink-0 text-xs font-semibold text-[var(--accent)] group-hover:underline">
            {item.actionLabel}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (item.actionHref) {
    return (
      <a href={item.actionHref} className="block h-full">
        {content}
      </a>
    );
  }

  if (item.targetId) {
    return (
      <a href={`#${item.targetId}`} className="block h-full">
        {content}
      </a>
    );
  }

  return content;
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
  const [wordpressMessage] = useState<string | null>(null);
  const [accountDraft, setAccountDraft] = useState("");
  const [accountSearchDraft, setAccountSearchDraft] = useState("");
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
    setAccountSearchDraft("");
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
    setMetaPreview(null);
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
    setShopifyMessage(
      "Client created. Connect Shopify only if this client is willing to share store access."
    );
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

  async function handleUpdateStoreAccessDeclined(storeAccessDeclined: boolean) {
    if (!activeClientId) {
      setShopifyMessage("Choose a client first.");
      return;
    }

    const response = await fetch("/api/admin/clients", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId: activeClientId,
        storeAccessDeclined,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      client?: ClientRecord;
    };

    if (!response.ok || !payload.client) {
      setShopifyMessage(payload.error ?? "Could not update store access for this client.");
      return;
    }

    await loadClients(payload.client.id);
    await loadShopifyStatus(payload.client.id);
    setShopifyMessage(
      storeAccessDeclined
        ? "Marked this client as not sharing website access. Shopify is now treated as optional for them."
        : "Cleared the declined-access state. You can connect Shopify whenever the client is ready."
    );
  }

  const storefrontIsConnected =
    activeClient?.websitePlatform === "wordpress"
      ? wordpressStatus?.previewReady
      : shopifyStatus?.previewReady;
  const storefrontLabel =
    activeClient?.websitePlatform === "wordpress" ? "WordPress" : "Shopify / Storefront";
  const storefrontContext =
    activeClient?.storeAccessDeclined
      ? "Client declined website access"
      : activeClient?.websitePlatform === "wordpress"
      ? wordpressStatus?.siteUrl || "WooCommerce source"
      : shopifyStatus?.shopName || shopifyStatus?.storeDomain || "Store approval required";

  const metaReadyState = metaStatus?.connected ? "Good" : metaStatus?.configured ? "Watch" : "Fix";
  const shopifyReadyState = shopifyStatus?.previewReady
    ? "Good"
    : activeClient?.storeAccessDeclined
    ? "Optional"
    : shopifyStatus?.configured
    ? "Watch"
    : "Fix";
  const wordpressReadyState = wordpressStatus?.previewReady ? "Good" : wordpressStatus?.configured ? "Watch" : "Fix";

  const connectionItems: ConnectionItem[] = [
    {
      id: "meta",
      name: "Meta",
      status: metaStatus?.selectedAccountId ? "Connected" : metaStatus?.connected ? "Needs account" : "Not connected",
      tone: metaStatus?.selectedAccountId ? "connected" : metaStatus?.connected ? "needs-action" : "not-connected",
      context: metaStatus?.selectedAccount?.name ?? metaStatus?.recommendedNextStep ?? "Connect Meta first",
      nextAction: metaStatus?.selectedAccountId
        ? metaStatus.selectedAccountId
        : metaStatus?.connected
        ? "Choose and save an ad account."
        : "Connect Meta for this client.",
      targetId: "meta-connection",
      actionHref: !metaStatus?.connected && activeClientId
        ? `/api/integrations/meta/connect?clientId=${encodeURIComponent(activeClientId)}`
        : undefined,
      actionLabel: metaStatus?.selectedAccountId ? "Review" : metaStatus?.connected ? "Choose" : "Connect",
    },
    {
      id: "storefront",
      name: storefrontLabel,
      status: storefrontIsConnected ? "Connected" : activeClient?.storeAccessDeclined ? "Optional" : "Not connected",
      tone: storefrontIsConnected ? "connected" : activeClient?.storeAccessDeclined ? "optional" : "needs-action",
      context: storefrontContext,
      nextAction: storefrontIsConnected
        ? "Store truth can feed revenue, orders, MER, and AOV."
        : activeClient?.storeAccessDeclined
        ? "Store metrics remain unavailable until the client opts in."
        : "Connect website source or mark access declined.",
      targetId: "storefront-connections",
      actionLabel: storefrontIsConnected ? "Review" : "Set up",
    },
    {
      id: "google-ads",
      name: "Google Ads",
      status: "Not connected",
      tone: "planned",
      context: "Integration not enabled yet",
      nextAction: "Keep visible as a missing paid channel for onboarding.",
      targetId: "planned-channels",
      actionLabel: "Planned",
    },
    {
      id: "tiktok",
      name: "TikTok",
      status: "Not connected",
      tone: "planned",
      context: "Integration not enabled yet",
      nextAction: "Add this source when TikTok spend needs to be blended.",
      targetId: "planned-channels",
      actionLabel: "Planned",
    },
    {
      id: "snapchat",
      name: "Snapchat",
      status: "Not connected",
      tone: "planned",
      context: "Integration not enabled yet",
      nextAction: "Use this as an onboarding checklist item for paid social.",
      targetId: "planned-channels",
      actionLabel: "Planned",
    },
  ];

  const connectedCount = connectionItems.filter((item) => item.tone === "connected").length;
  const needsActionCount = connectionItems.filter(
    (item) => item.tone === "needs-action" || item.tone === "not-connected"
  ).length;
  const plannedCount = connectionItems.filter((item) => item.tone === "planned").length;

  return (
    <AppShell>
      <div className="space-y-4">
        <Notice
          message={
            clientStorage
              ? clientStorage.durable
                ? `Client storage is durable now through ${clientStorage.location}.`
                : `Client storage is temporary through ${clientStorage.location}. Configure durable storage before relying on saved client setup.`
              : null
          }
          tone={clientStorage?.durable ? "info" : "warn"}
        />

        <AdminPanel
          eyebrow="Client Onboarding"
          title="Connection Overview"
          description="See what is already connected and what still needs setup for the selected client before scrolling into detailed configuration."
          action={<StatusPill status={`${connectedCount}/${connectionItems.length} connected`} />}
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,0.75fr),minmax(0,1.25fr)]">
            <div className="rounded-[16px] border border-[var(--line)] bg-white/62 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Selected Client
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-[var(--ink)]">
                {activeClient?.name ?? "No client selected"}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill status={activeClient?.websitePlatform ?? "Website pending"} />
                <StatusPill
                  status={
                    activeClient
                      ? getCurrencyMeta(activeClient.currencyCode).label
                      : "Currency pending"
                  }
                />
                <StatusPill status={`${clients.length} saved clients`} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-[12px] border border-[var(--line)] bg-white/58 px-2 py-2">
                  <div className="text-lg font-semibold text-[var(--ink)]">{connectedCount}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Live</div>
                </div>
                <div className="rounded-[12px] border border-orange-200 bg-orange-50 px-2 py-2">
                  <div className="text-lg font-semibold text-orange-900">{needsActionCount}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-orange-900">Action</div>
                </div>
                <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-2 py-2">
                  <div className="text-lg font-semibold text-slate-800">{plannedCount}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-700">Planned</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {connectionItems.map((item) => (
                <ConnectionOverviewCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </AdminPanel>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr),minmax(420px,1.1fr)]">
          <AdminPanel
            eyebrow="Client Setup"
            title="Client Workspace"
            description="Switch client context, confirm reporting basics, and keep onboarding state tied to the right store."
            action={<StatusPill status={activeClient ? "Selected" : "Choose client"} />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminStat
                label="Website Type"
                value={activeClient?.websitePlatform ?? "Not set"}
                hint="Determines the storefront truth source."
              />
              <AdminStat
                label="Meta State"
                value={metaStatus?.connected ? "Connected" : "Pending"}
                hint={metaStatus?.recommendedNextStep ?? "Connect Meta for this client."}
              />
            </div>

            <div className="mt-4 grid gap-3">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Client Selector
              </label>
              <select
                value={activeClientId}
                onChange={(event) => handleClientSelection(event.target.value)}
                className={fieldClass}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} · {client.websitePlatform} · {client.currencyCode}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 border-t border-[var(--line)] pt-4">
              <div className="text-sm font-semibold text-[var(--ink)]">Add New Client</div>
              <div className="mt-3 grid gap-3">
                <input
                  value={clientNameDraft}
                  onChange={(event) => setClientNameDraft(event.target.value)}
                  placeholder="Client name"
                  className={fieldClass}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={websitePlatformDraft}
                    onChange={(event) =>
                      setWebsitePlatformDraft(event.target.value as WebsitePlatform)
                    }
                    className={fieldClass}
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
                    className={fieldClass}
                  >
                    {SUPPORTED_CLIENT_CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  rows={3}
                  placeholder="Optional notes"
                  className={fieldClass}
                />
              </div>

              <div className="mt-3">
                <Notice message={clientMessage} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleCreateClient()}
                  className={primaryButtonClass}
                >
                  Create Client
                </button>
                <button
                  type="button"
                  onClick={() => void loadClients(activeClientId)}
                  className={secondaryButtonClass}
                >
                  Refresh Clients
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteClient()}
                  className={dangerButtonClass}
                >
                  Delete Active Client
                </button>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel
            eyebrow="Source Setup"
            title="Meta Connection"
            description="Connect Meta, choose the exact ad account, and preview source data before syncing."
            action={<StatusPill status={metaReadyState} />}
          >
            <div id="meta-connection" className="grid gap-3 md:grid-cols-2">
              <AdminStat
                label="Connection"
                value={metaStatus?.connected ? "Connected" : "Needs connection"}
                hint={metaStatus?.appMode ? `App mode: ${metaStatus.appMode}` : "Use the official Meta flow."}
              />
              <AdminStat
                label="Selected Account"
                value={metaStatus?.selectedAccount?.name ?? "Not selected"}
                hint={metaStatus?.selectedAccountId ?? "Save an ad account to this client."}
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(300px,0.75fr)]">
              <AdminBlock
                title="Save Account To Client"
                description="Search connected Meta accounts by name or ID, confirm the result, then save it to the active client."
                action={<StatusPill status={accountDraft ? "Account chosen" : "Choose account"} />}
              >
                <MetaAccountSearchPicker
                  accounts={metaStatus?.accounts ?? []}
                  selectedAccountId={accountDraft}
                  searchValue={accountSearchDraft}
                  onSearchChange={setAccountSearchDraft}
                  onSelect={setAccountDraft}
                />
                <div className="mt-3 text-xs leading-5 text-[var(--muted)]">
                  Search matches both account name and account ID. Missing accounts usually mean the connected Meta user does not have access in Business Manager.
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveMetaAccount()}
                    className={primaryButtonClass}
                  >
                    {metaStatus?.selectedAccountId === accountDraft
                      ? "Saved To Client"
                      : "Save Account To Client"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleLoadMetaPreview()}
                    className={secondaryButtonClass}
                  >
                    Load Insights Preview
                  </button>
                </div>
              </AdminBlock>

              <div className="space-y-3">
                <AdminBlock title="Meta Actions">
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={
                        activeClientId
                          ? `/api/integrations/meta/connect?clientId=${encodeURIComponent(activeClientId)}`
                          : "/admin"
                      }
                      className={primaryButtonClass}
                    >
                      {metaStatus?.connected ? "Reconnect Meta" : "Connect Meta"}
                    </a>
                    <button
                      type="button"
                      onClick={() => void loadMetaStatus(activeClientId)}
                      className={secondaryButtonClass}
                    >
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDisconnectMeta()}
                      className={dangerButtonClass}
                    >
                      Disconnect
                    </button>
                  </div>
                </AdminBlock>

                <AdminBlock title="Callback URL">
                  <div className="break-all text-sm font-medium text-[var(--accent)]">
                    {metaStatus?.callbackUrl ?? "/api/integrations/meta/callback"}
                  </div>
                </AdminBlock>

                <MissingEnv values={metaStatus?.missingEnv ?? []} />
                <Notice message={metaStatus?.connectionError ?? null} tone="warn" />
                <Notice message={metaMessage} />
              </div>
            </div>
          </AdminPanel>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),minmax(360px,0.65fr)]">
          <AdminPanel
            eyebrow="Store Truth"
            title="Storefront Connections"
            description="Keep the website source visible without letting connection setup dominate the page."
          >
            <div id="storefront-connections" className="grid gap-4 lg:grid-cols-2">
              <AdminBlock
                title="Shopify"
                description={shopifyStatus?.recommendedNextStep ?? "Checking Shopify status"}
                action={<StatusPill status={shopifyReadyState} />}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminStat
                    label="Client"
                    value={shopifyStatus?.client.name ?? activeClient?.name ?? "None"}
                    hint={
                      activeClient?.storeAccessDeclined
                        ? "Website access has been declined for now."
                        : "Connected per client through store approval."
                    }
                  />
                  <AdminStat
                    label="Connected Store"
                    value={shopifyStatus?.shopName ?? "Not connected"}
                    hint={
                      activeClient?.storeAccessDeclined
                        ? "Store truth is optional until they opt in."
                        : shopifyStatus?.storeDomain ?? "Start the Shopify install flow."
                    }
                  />
                </div>

                <div className="mt-3 space-y-3">
                  <MissingEnv values={shopifyStatus?.missingEnv ?? []} />
                  <Notice message={shopifyStatus?.connectionError ?? null} tone="warn" />
                  <Notice
                    message={
                      activeClient?.storeAccessDeclined && !shopifyStatus?.connected
                        ? "This client is marked as not sharing website access. Shopify-dependent metrics will stay unavailable until they opt in."
                        : null
                    }
                    tone="warn"
                  />
                  <Notice message={shopifyMessage} />
                </div>

                <div className="mt-4 border-t border-[var(--line)] pt-4">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Install Store To Client
                  </label>
                  <input
                    value={shopifyStoreDomainDraft}
                    onChange={(event) => setShopifyStoreDomainDraft(event.target.value)}
                    placeholder="your-store.myshopify.com"
                    className={`mt-2 ${fieldClass}`}
                  />
                  <div className="mt-2 text-xs leading-5 text-[var(--muted)]">
                    Opens Shopify approval so the store owner can approve access for this client store.
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleConnectShopify}
                      className={primaryButtonClass}
                    >
                      {shopifyStatus?.connected ? "Reconnect Shopify" : "Connect Shopify"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadShopifyStatus(activeClientId)}
                      className={secondaryButtonClass}
                    >
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDisconnectShopify()}
                      className={dangerButtonClass}
                    >
                      Disconnect
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void handleUpdateStoreAccessDeclined(
                          !(activeClient?.storeAccessDeclined ?? false)
                        )
                      }
                      className={warningButtonClass}
                    >
                      {activeClient?.storeAccessDeclined
                        ? "Clear Declined Access"
                        : "Mark Access Declined"}
                    </button>
                  </div>
                </div>
              </AdminBlock>

              <AdminBlock
                title="WordPress / WooCommerce"
                description={wordpressStatus?.recommendedNextStep ?? "Checking WordPress status"}
                action={<StatusPill status={wordpressReadyState} />}
              >
                <div className="space-y-3">
                  <MissingEnv values={wordpressStatus?.missingEnv ?? []} />
                  <Notice
                    message={wordpressStatus?.connectionError ?? wordpressMessage}
                    tone="warn"
                  />
                  <div className="rounded-[14px] border border-[var(--line)] bg-white/45 px-3 py-3 text-sm leading-6 text-[var(--muted)]">
                    The dashboard keeps the client website currency as the main truth. Platform currency differences can be converted underneath without changing the client currency itself.
                  </div>
                </div>
              </AdminBlock>
            </div>
          </AdminPanel>

          <div className="space-y-4">
            <AdminPanel
              eyebrow="Missing Channels"
              title="Planned Paid Channels"
              description="Keep these visible during onboarding so missing traffic sources are not forgotten."
              action={<StatusPill status="Planned" />}
            >
              <div id="planned-channels" className="space-y-3">
                {connectionItems
                  .filter((item) => item.tone === "planned")
                  .map((item) => (
                    <AdminBlock
                      key={item.id}
                      title={item.name}
                      description={item.nextAction}
                      action={<StatusPill status="Not connected" />}
                    >
                      <div className="text-sm leading-6 text-[var(--muted)]">
                        {item.context}. This is surfaced as a setup opportunity, but no connector is enabled for this channel yet.
                      </div>
                    </AdminBlock>
                  ))}
              </div>
            </AdminPanel>

            <AdminPanel
              eyebrow="Governance"
              title="Metric Logic"
              description="Review definitions and source mappings before exposing future admin-editable controls."
              action={<StatusPill status="Live" />}
            >
              <div className="space-y-3">
                <AdminBlock
                  title="Metric Registry Workspace"
                  description="Inspect source truth, field binding, aggregation style, and whether each metric should stay code-managed."
                >
                  <Link href="/admin/metrics" className={primaryButtonClass}>
                    Open Metric Registry
                  </Link>
                </AdminBlock>
                <AdminStat
                  label="Review Priority"
                  value="Ad Spend, Store Revenue, MER, Blended ROAS, CPA / CAC"
                  hint="Keep governance focused on metrics that change media buying decisions."
                />
              </div>
            </AdminPanel>

            <AdminPanel
              eyebrow="Preview"
              title="Sync Checks"
              description="Compact source-readiness checks for preview data and recent sync activity."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminStat
                  label="Meta Preview Spend"
                  value={
                    metaPreview && metaStatus?.selectedAccount?.currency
                      ? `${metaStatus.selectedAccount.currency} ${metaPreview.totals.spend.toFixed(0)}`
                      : "Waiting"
                  }
                  hint="Live Meta preview"
                />
                <AdminStat
                  label="Meta Preview Revenue"
                  value={
                    metaPreview && metaStatus?.selectedAccount?.currency
                      ? `${metaStatus.selectedAccount.currency} ${metaPreview.totals.purchaseValue.toFixed(0)}`
                      : "Waiting"
                  }
                  hint="Platform-attributed value"
                />
              </div>
              <div className="mt-3 rounded-[14px] border border-[var(--line)] bg-white/45 px-3 py-2">
                <DetailRow
                  label="Storage"
                  value={syncState?.storage.storageMode ?? "Not loaded"}
                />
                <DetailRow
                  label="Location"
                  value={syncState?.storage.location ?? "Storage pending"}
                />
                <DetailRow
                  label="Recent Runs"
                  value={`${syncState?.syncRuns.length ?? 0}`}
                />
              </div>

              <div className="mt-3 rounded-[14px] border border-[var(--line)] bg-white/45 p-3">
                <div className="text-sm font-semibold text-[var(--ink)]">Latest Sync Notes</div>
                <div className="mt-2 space-y-2 text-sm text-[var(--muted)]">
                  {(syncState?.syncRuns ?? []).slice(0, 3).map((run) => (
                    <div key={run.id} className="rounded-[12px] bg-white/62 px-3 py-2">
                      <div className="font-semibold text-[var(--ink)]">
                        {run.clientName ? `${run.clientName} · ` : ""}
                        {run.platform} · {run.status}
                      </div>
                      <div className="mt-1 text-xs leading-5">
                        {run.notes[0] ?? run.finishedAt ?? "No notes yet"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AdminPanel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
