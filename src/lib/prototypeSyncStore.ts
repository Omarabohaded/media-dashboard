import type {
  BusinessTruthSnapshot,
  IntegrationConnectionRecord,
  MediaPlatformSnapshot,
  SyncRunRecord,
  SyncStateStore,
} from "./syncContracts";
import {
  getRuntimeStorageMeta,
  readRuntimeJsonStore,
  writeRuntimeJsonStore,
} from "./runtimeStorage";

const SYNC_STORE_KEY = "media-dashboard:sync-state";
const SYNC_STORE_FILE = "sync-state.json";

function defaultState(): SyncStateStore {
  const storageMeta = getRuntimeStorageMeta(SYNC_STORE_FILE);

  return {
    version: 1,
    storageMode: storageMeta.storageMode,
    updatedAt: null,
    connections: [],
    syncRuns: [],
    businessTruthSnapshots: [],
    mediaSnapshots: [],
  };
}

export async function readSyncStateStore(): Promise<SyncStateStore> {
  const parsed = await readRuntimeJsonStore<SyncStateStore>(
    SYNC_STORE_KEY,
    SYNC_STORE_FILE,
    defaultState()
  );

  return {
    ...defaultState(),
    ...parsed,
  };
}

export async function getSyncStorageMeta() {
  return getRuntimeStorageMeta(SYNC_STORE_FILE);
}

export async function updateSyncStateStore(
  updater: (state: SyncStateStore) => SyncStateStore
) {
  const current = await readSyncStateStore();
  const next = updater(current);
  next.updatedAt = new Date().toISOString();
  next.storageMode = getRuntimeStorageMeta(SYNC_STORE_FILE).storageMode;
  await writeRuntimeJsonStore(SYNC_STORE_KEY, SYNC_STORE_FILE, next);
  return next;
}

export async function upsertConnectionRecord(
  connection: IntegrationConnectionRecord
) {
  return updateSyncStateStore((state) => {
    const connections = state.connections.filter(
      (item) =>
        !(
          item.platform === connection.platform &&
          item.clientId === connection.clientId
        )
    );

    connections.unshift(connection);

    return {
      ...state,
      connections,
    };
  });
}

export async function appendSyncRun(run: SyncRunRecord) {
  return updateSyncStateStore((state) => ({
    ...state,
    syncRuns: [run, ...state.syncRuns].slice(0, 25),
  }));
}

export async function appendBusinessTruthSnapshot(snapshot: BusinessTruthSnapshot) {
  return updateSyncStateStore((state) => ({
    ...state,
    businessTruthSnapshots: [snapshot, ...state.businessTruthSnapshots].slice(0, 30),
  }));
}

export async function appendMediaSnapshot(snapshot: MediaPlatformSnapshot) {
  return updateSyncStateStore((state) => ({
    ...state,
    mediaSnapshots: [snapshot, ...state.mediaSnapshots].slice(0, 30),
  }));
}

export async function clearClientSyncState(clientId: string) {
  await updateSyncStateStore((state) => ({
    ...state,
    connections: state.connections.filter((item) => item.clientId !== clientId),
    syncRuns: state.syncRuns.filter((item) => item.clientId !== clientId),
    businessTruthSnapshots: state.businessTruthSnapshots.filter(
      (item) => item.clientId !== clientId
    ),
    mediaSnapshots: state.mediaSnapshots.filter(
      (item) => item.clientId !== clientId
    ),
  }));
}
