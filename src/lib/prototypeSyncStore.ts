import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import {
  BusinessTruthSnapshot,
  IntegrationConnectionRecord,
  MediaPlatformSnapshot,
  SyncRunRecord,
  SyncStateStore,
} from "./syncContracts";

const STORE_DIR = path.join(tmpdir(), "media-dashboard");
const STORE_FILE = path.join(STORE_DIR, "sync-state.json");

function defaultState(): SyncStateStore {
  return {
    version: 1,
    storageMode: "ephemeral_tmp",
    updatedAt: null,
    connections: [],
    syncRuns: [],
    businessTruthSnapshots: [],
    mediaSnapshots: [],
  };
}

async function ensureStoreDir() {
  await mkdir(STORE_DIR, { recursive: true });
}

export async function readSyncStateStore(): Promise<SyncStateStore> {
  try {
    const raw = await readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as SyncStateStore;

    return {
      ...defaultState(),
      ...parsed,
    };
  } catch {
    return defaultState();
  }
}

async function writeSyncStateStore(state: SyncStateStore) {
  await ensureStoreDir();
  await writeFile(STORE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

export async function getSyncStorageMeta() {
  return {
    filePath: STORE_FILE,
    storageMode: "ephemeral_tmp" as const,
  };
}

export async function updateSyncStateStore(
  updater: (state: SyncStateStore) => SyncStateStore
) {
  const current = await readSyncStateStore();
  const next = updater(current);
  next.updatedAt = new Date().toISOString();
  await writeSyncStateStore(next);
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
