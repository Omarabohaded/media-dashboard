import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import {
  type ClientCurrencyCode,
  type ClientRecord,
  type WebsitePlatform,
} from "@/lib/clientTypes";

export type MetaClientConnection = {
  clientId: string;
  accessToken: string;
  connectedAt: string;
  selectedAccountId: string | null;
  selectedAccountName: string | null;
  lastError: string | null;
};

type ClientStoreState = {
  version: 1;
  updatedAt: string | null;
  clients: ClientRecord[];
  metaConnections: MetaClientConnection[];
};

const STORE_DIR = path.join(tmpdir(), "media-dashboard");
const STORE_FILE = path.join(STORE_DIR, "client-state.json");

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
  };
}

async function ensureStoreDir() {
  await mkdir(STORE_DIR, { recursive: true });
}

async function writeState(state: ClientStoreState) {
  await ensureStoreDir();
  await writeFile(STORE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

export async function readClientStore(): Promise<ClientStoreState> {
  try {
    const raw = await readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as ClientStoreState;
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

    return state;
  } catch {
    return defaultState();
  }
}

async function updateClientStore(
  updater: (state: ClientStoreState) => ClientStoreState
) {
  const current = await readClientStore();
  const next = updater(current);
  next.updatedAt = new Date().toISOString();
  await writeState(next);
  return next;
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
