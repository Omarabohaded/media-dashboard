import { readRuntimeJsonStore, writeRuntimeJsonStore } from "@/lib/runtimeStorage";

export type TikTokClientConnection = {
  clientId: string;
  accessToken: string;
  refreshToken: string | null;
  connectedAt: string;
  selectedAdvertiserId: string | null;
  selectedAdvertiserName: string | null;
  lastError: string | null;
};

type TikTokConnectionState = {
  version: 1;
  updatedAt: string | null;
  connections: TikTokClientConnection[];
};

const STORE_KEY = "media-dashboard:tiktok-connections";
const STORE_FILE = "tiktok-connections.json";

function defaultState(): TikTokConnectionState {
  return {
    version: 1,
    updatedAt: null,
    connections: [],
  };
}

export async function readTikTokConnectionStore() {
  const parsed = await readRuntimeJsonStore<Partial<TikTokConnectionState>>(
    STORE_KEY,
    STORE_FILE,
    defaultState()
  );

  return {
    ...defaultState(),
    ...parsed,
    connections: (parsed.connections ?? []).map((connection) => ({
      ...connection,
      refreshToken: connection.refreshToken ?? null,
      selectedAdvertiserId: connection.selectedAdvertiserId ?? null,
      selectedAdvertiserName: connection.selectedAdvertiserName ?? null,
      lastError: connection.lastError ?? null,
    })),
  } satisfies TikTokConnectionState;
}

async function updateTikTokConnectionStore(
  updater: (state: TikTokConnectionState) => TikTokConnectionState
) {
  const current = await readTikTokConnectionStore();
  const next = updater(current);
  next.updatedAt = new Date().toISOString();
  await writeRuntimeJsonStore(STORE_KEY, STORE_FILE, next);
  return next;
}

export async function getTikTokConnection(clientId: string) {
  const state = await readTikTokConnectionStore();
  return state.connections.find((connection) => connection.clientId === clientId) ?? null;
}

export async function upsertTikTokConnection(connection: TikTokClientConnection) {
  await updateTikTokConnectionStore((state) => ({
    ...state,
    connections: [
      connection,
      ...state.connections.filter((item) => item.clientId !== connection.clientId),
    ],
  }));

  return connection;
}

export async function clearTikTokConnection(clientId: string) {
  await updateTikTokConnectionStore((state) => ({
    ...state,
    connections: state.connections.filter((connection) => connection.clientId !== clientId),
  }));
}
