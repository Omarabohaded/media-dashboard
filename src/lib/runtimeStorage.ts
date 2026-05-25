import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export type RuntimeStorageMode = "vercel_kv" | "ephemeral_tmp";

type StorageMeta = {
  storageMode: RuntimeStorageMode;
  location: string;
  durable: boolean;
};

const STORE_DIR = path.join(tmpdir(), "media-dashboard");

function getKvConfig() {
  const url =
    process.env.KV_REST_API_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    "";
  const token =
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    "";

  return {
    url,
    token,
    enabled: Boolean(url && token),
  };
}

async function ensureStoreDir() {
  await mkdir(STORE_DIR, { recursive: true });
}

function resolveFilePath(fileName: string) {
  return path.join(STORE_DIR, fileName);
}

async function readFromKv<T>(key: string): Promise<T | null> {
  const config = getKvConfig();

  if (!config.enabled) {
    return null;
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["GET", key]),
    cache: "no-store",
  });

  const payload = (await response.json()) as { result?: string | null; error?: string };

  if (!response.ok || payload.error) {
    throw new Error(payload.error || "Could not read from durable storage.");
  }

  if (!payload.result) {
    return null;
  }

  return JSON.parse(payload.result) as T;
}

async function writeToKv<T>(key: string, value: T) {
  const config = getKvConfig();

  if (!config.enabled) {
    throw new Error("Durable storage is not configured.");
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["SET", key, JSON.stringify(value)]),
    cache: "no-store",
  });

  const payload = (await response.json()) as { result?: string; error?: string };

  if (!response.ok || payload.error) {
    throw new Error(payload.error || "Could not write to durable storage.");
  }
}

async function readFromTmpFile<T>(fileName: string): Promise<T | null> {
  try {
    const raw = await readFile(resolveFilePath(fileName), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeToTmpFile<T>(fileName: string, value: T) {
  await ensureStoreDir();
  await writeFile(resolveFilePath(fileName), JSON.stringify(value, null, 2), "utf-8");
}

export async function readRuntimeJsonStore<T>(
  key: string,
  fileName: string,
  fallback: T
): Promise<T> {
  try {
    const kvValue = await readFromKv<T>(key);

    if (kvValue) {
      return kvValue;
    }
  } catch {
    // Fall through to tmp-file fallback when durable storage is unavailable.
  }

  const tmpValue = await readFromTmpFile<T>(fileName);
  return tmpValue ?? fallback;
}

export async function writeRuntimeJsonStore<T>(
  key: string,
  fileName: string,
  value: T
) {
  const config = getKvConfig();

  if (config.enabled) {
    await writeToKv(key, value);
    return;
  }

  await writeToTmpFile(fileName, value);
}

export function getRuntimeStorageMeta(fileName: string): StorageMeta {
  const config = getKvConfig();

  if (config.enabled) {
    return {
      storageMode: "vercel_kv",
      location: "Vercel KV / Upstash REST",
      durable: true,
    };
  }

  return {
    storageMode: "ephemeral_tmp",
    location: resolveFilePath(fileName),
    durable: false,
  };
}
