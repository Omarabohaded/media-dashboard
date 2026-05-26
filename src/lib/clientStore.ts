import {
  type ClientCurrencyCode,
  type ClientRecord,
  type WebsitePlatform,
} from "@/lib/clientTypes";
import {
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

type ClientStoreState = {
  version: 1;
  updatedAt: string | null;
  clients: ClientRecord[];
  metaConnections: MetaClientConnection[];
  shopifyConnections: ShopifyClientConnection[];
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
  };
}

function defaultState(): ClientStoreState {
  return {
    version: 1,
    updatedAt: null,
    clients: [buildDefaultClient()],
    metaConnections: [],
    shopifyConnections: [],
  };
}

export async function readClientStore(): Promise<ClientStoreState> {
  const parsed = await readRuntimeJsonStore<ClientStoreState>(
    CLIENT_STORE_KEY,
    CLIENT_STORE_FILE,
    defaultState()
  );
  const state = {
    ...defaultState(),
    ...parsed,
  };

  if (!state.clients.length) {
    state.clients = [buildDefaultClient()];
  }

  state.clients = state.clients.map((client) => ({
    ...client,
    currencyCode: client.currencyCode ?? "USD",
  }));

  state.metaConnections = state.metaConnections ?? [];
  state.shopifyConnections = (state.shopifyConnections ?? []).map((connection) => ({
    ...connection,
    accessToken: connection.accessToken ?? "",
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
  };

  await updateClientStore((state) => ({
    ...state,
    clients: [client, ...state.clients],
  }));

  return client;
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
  }));
}
