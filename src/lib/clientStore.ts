import {
  type ClientCurrencyCode,
  type ClientRecord,
  type WebsitePlatform,
} from "@/lib/clientTypes";
import {
  checkRuntimeJsonStoreHealth,
  getRuntimeStorageMeta,
  readRuntimeJsonStore,
  writeRuntimeJsonStore,
} from "@/lib/runtimeStorage";

export type MetaClientConnection = {
  clientId: string;
  accessToken: string;
  connectedAt: string;
  selectedAccountId: string | null;
  selectedAccountName: string | null;
  lastError: string | null;
};

export type ShopifyClientConnection = {
  clientId: string;
  storeDomain: string;
  accessToken: string;
  connectedAt: string;
  shopName: string | null;
  lastError: string | null;
};

export type WooCommerceClientConnection = {
  clientId: string;
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  connectedAt: string;
  storeName: string | null;
  currencyCode: string | null;
  lastError: string | null;
};

type ClientStoreState = {
  version: 1;
  updatedAt: string | null;
  clients: ClientRecord[];
  metaConnections: MetaClientConnection[];
  shopifyConnections: ShopifyClientConnection[];
  wooCommerceConnections: WooCommerceClientConnection[];
};

const CLIENT_STORE_KEY = "media-dashboard:client-state";
const CLIENT_STORE_FILE = "client-state.json";

function buildDefaultClient(): ClientRecord {
  return {
    id: "client-unresolved-crime",
    name: "Unresolved Crime",
    websitePlatform: "shopify",
    currencyCode: "USD",
    notes: "Prototype seed client",
    createdAt: new Date().toISOString(),
    storeAccessDeclined: false,
    storeAccessDeclinedAt: null,
  };
}

function defaultState(): ClientStoreState {
  return {
    version: 1,
    updatedAt: null,
    clients: [buildDefaultClient()],
    metaConnections: [],
    shopifyConnections: [],
    wooCommerceConnections: [],
  };
}

export async function readClientStore(): Promise<ClientStoreState> {
  const parsed = await readRuntimeJsonStore<Partial<ClientStoreState>>(
    CLIENT_STORE_KEY,
    CLIENT_STORE_FILE,
    defaultState()
  );
  const state = {
    ...defaultState(),
    ...parsed,
  } as ClientStoreState;

  if (!state.clients.length) {
    state.clients = [buildDefaultClient()];
  }

  state.clients = state.clients.map((client) => ({
    ...client,
    currencyCode: client.currencyCode ?? "USD",
    storeAccessDeclined: client.storeAccessDeclined ?? false,
    storeAccessDeclinedAt: client.storeAccessDeclinedAt ?? null,
  }));

  state.metaConnections = state.metaConnections ?? [];
  state.shopifyConnections = (state.shopifyConnections ?? []).map((connection) => ({
    ...connection,
    accessToken: connection.accessToken ?? "",
  }));
  state.wooCommerceConnections = (state.wooCommerceConnections ?? []).map((connection) => ({
    ...connection,
    storeUrl: connection.storeUrl ?? "",
    consumerKey: connection.consumerKey ?? "",
    consumerSecret: connection.consumerSecret ?? "",
    storeName: connection.storeName ?? null,
    currencyCode: connection.currencyCode ?? null,
    lastError: connection.lastError ?? null,
  }));

  return state;
}

async function updateClientStore(
  updater: (state: ClientStoreState) => ClientStoreState
) {
  const current = await readClientStore();
  const next = updater(current);
  next.updatedAt = new Date().toISOString();
  await writeRuntimeJsonStore(CLIENT_STORE_KEY, CLIENT_STORE_FILE, next);
  return next;
}

export function getClientStoreMeta() {
  return getRuntimeStorageMeta(CLIENT_STORE_FILE);
}

export async function getClientStoreHealth() {
  const [state, storage] = await Promise.all([
    readClientStore(),
    checkRuntimeJsonStoreHealth(CLIENT_STORE_KEY, CLIENT_STORE_FILE),
  ]);

  return {
    ...storage,
    storeKey: CLIENT_STORE_KEY,
    stateVersion: state.version,
    updatedAt: state.updatedAt,
    clientCount: state.clients.length,
  };
}

export async function listClients() {
  const state = await readClientStore();
  return state.clients;
}

export async function getClientById(clientId: string | null | undefined) {
  const state = await readClientStore();
  const fallback = state.clients[0] ?? buildDefaultClient();

  if (!clientId) {
    return fallback;
  }

  return state.clients.find((client) => client.id === clientId) ?? fallback;
}

export async function getRequiredClientById(clientId: string | null | undefined) {
  if (!clientId) {
    throw new Error("A client ID is required.");
  }

  const state = await readClientStore();
  const client = state.clients.find((item) => item.id === clientId);

  if (!client) {
    throw new Error("Client was not found.");
  }

  return client;
}

export async function createClient(input: {
  name: string;
  websitePlatform: WebsitePlatform;
  currencyCode: ClientCurrencyCode;
  notes?: string | null;
}) {
  const client: ClientRecord = {
    id: `client-${crypto.randomUUID()}`,
    name: input.name,
    websitePlatform: input.websitePlatform,
    currencyCode: input.currencyCode,
    notes: input.notes?.trim() || null,
    createdAt: new Date().toISOString(),
    storeAccessDeclined: false,
    storeAccessDeclinedAt: null,
  };

  await updateClientStore((state) => ({
    ...state,
    clients: [client, ...state.clients],
  }));

  return client;
}

export async function updateClient(input: {
  clientId: string;
  name: string;
  websitePlatform: WebsitePlatform;
  currencyCode: ClientCurrencyCode;
  notes?: string | null;
}) {
  const nextState = await updateClientStore((state) => {
    if (!state.clients.some((client) => client.id === input.clientId)) {
      throw new Error("Client was not found.");
    }
    return {
      ...state,
      clients: state.clients.map((client) =>
        client.id === input.clientId
          ? {
              ...client,
              name: input.name.trim(),
              websitePlatform: input.websitePlatform,
              currencyCode: input.currencyCode,
              notes: input.notes?.trim() || null,
            }
          : client
      ),
    };
  });
  return nextState.clients.find((client) => client.id === input.clientId)!;
}

export async function updateClientStoreAccess(input: {
  clientId: string;
  storeAccessDeclined: boolean;
}) {
  const nextState = await updateClientStore((state) => {
    const exists = state.clients.some((client) => client.id === input.clientId);

    if (!exists) {
      throw new Error("Client was not found.");
    }

    return {
      ...state,
      clients: state.clients.map((client) =>
        client.id === input.clientId
          ? {
              ...client,
              storeAccessDeclined: input.storeAccessDeclined,
              storeAccessDeclinedAt: input.storeAccessDeclined
                ? new Date().toISOString()
                : null,
            }
          : client
      ),
    };
  });

  return (
    nextState.clients.find((client) => client.id === input.clientId) ?? null
  );
}

export async function getMetaConnection(clientId: string) {
  const state = await readClientStore();
  return (
    state.metaConnections.find((connection) => connection.clientId === clientId) ??
    null
  );
}

export async function upsertMetaConnection(connection: MetaClientConnection) {
  await updateClientStore((state) => ({
    ...state,
    metaConnections: [
      connection,
      ...state.metaConnections.filter((item) => item.clientId !== connection.clientId),
    ],
  }));

  return connection;
}

export async function clearMetaConnection(clientId: string) {
  await updateClientStore((state) => ({
    ...state,
    metaConnections: state.metaConnections.filter(
      (connection) => connection.clientId !== clientId
    ),
  }));
}

export async function getShopifyConnection(clientId: string) {
  const state = await readClientStore();
  return (
    state.shopifyConnections.find(
      (connection) => connection.clientId === clientId
    ) ?? null
  );
}

export async function upsertShopifyConnection(connection: ShopifyClientConnection) {
  await updateClientStore((state) => ({
    ...state,
    clients: state.clients.map((client) =>
      client.id === connection.clientId
        ? {
            ...client,
            storeAccessDeclined: false,
            storeAccessDeclinedAt: null,
          }
        : client
    ),
    shopifyConnections: [
      connection,
      ...state.shopifyConnections.filter(
        (item) => item.clientId !== connection.clientId
      ),
    ],
  }));

  return connection;
}

export async function clearShopifyConnection(clientId: string) {
  await updateClientStore((state) => ({
    ...state,
    shopifyConnections: state.shopifyConnections.filter(
      (connection) => connection.clientId !== clientId
    ),
  }));
}

export async function getWooCommerceConnection(clientId: string) {
  const state = await readClientStore();
  return (
    state.wooCommerceConnections.find(
      (connection) => connection.clientId === clientId
    ) ?? null
  );
}

export async function upsertWooCommerceConnection(
  connection: WooCommerceClientConnection
) {
  await updateClientStore((state) => ({
    ...state,
    clients: state.clients.map((client) =>
      client.id === connection.clientId
        ? {
            ...client,
            websitePlatform: "woocommerce",
            storeAccessDeclined: false,
            storeAccessDeclinedAt: null,
          }
        : client
    ),
    wooCommerceConnections: [
      connection,
      ...state.wooCommerceConnections.filter(
        (item) => item.clientId !== connection.clientId
      ),
    ],
  }));

  return connection;
}

export async function clearWooCommerceConnection(clientId: string) {
  await updateClientStore((state) => ({
    ...state,
    wooCommerceConnections: state.wooCommerceConnections.filter(
      (connection) => connection.clientId !== clientId
    ),
  }));
}

export async function deleteClient(clientId: string) {
  const state = await readClientStore();

  if (state.clients.length <= 1) {
    throw new Error("At least one client must remain in the dashboard.");
  }

  const exists = state.clients.some((client) => client.id === clientId);

  if (!exists) {
    throw new Error("Client was not found.");
  }

  await updateClientStore((current) => ({
    ...current,
    clients: current.clients.filter((client) => client.id !== clientId),
    metaConnections: current.metaConnections.filter(
      (connection) => connection.clientId !== clientId
    ),
    shopifyConnections: current.shopifyConnections.filter(
      (connection) => connection.clientId !== clientId
    ),
    wooCommerceConnections: current.wooCommerceConnections.filter(
      (connection) => connection.clientId !== clientId
    ),
  }));
}
