import { readRuntimeJsonStore, writeRuntimeJsonStore } from "@/lib/runtimeStorage";
import type { PaidMediaSourceType } from "@/lib/paidMediaContract";

export type SourceConversionMapping = {
  sourceType: PaidMediaSourceType;
  scope: "global" | "client";
  clientId: string | null;
  purchasesEvent: string | null;
  purchaseValueEvent: string | null;
  enabled: boolean;
  updatedAt: string | null;
};

export type ResolvedSourceConversionMapping = {
  sourceType: PaidMediaSourceType;
  purchasesEvent: string | null;
  purchaseValueEvent: string | null;
  status:
    | "mapped"
    | "missing_mapping"
    | "missing_purchase_mapping"
    | "missing_purchase_value_mapping";
};

const STORE_KEY = "source-conversion-mappings";
const STORE_FILE = "source-conversion-mappings.json";

const DEFAULTS: SourceConversionMapping[] = [
  {
    sourceType: "meta",
    scope: "global",
    clientId: null,
    purchasesEvent: "purchase",
    purchaseValueEvent: "purchase",
    enabled: true,
    updatedAt: null,
  },
  { sourceType: "tiktok", scope: "global", clientId: null, purchasesEvent: null, purchaseValueEvent: null, enabled: true, updatedAt: null },
  { sourceType: "google", scope: "global", clientId: null, purchasesEvent: null, purchaseValueEvent: null, enabled: true, updatedAt: null },
  { sourceType: "snap", scope: "global", clientId: null, purchasesEvent: null, purchaseValueEvent: null, enabled: true, updatedAt: null },
];

export async function listSourceConversionMappings() {
  return readRuntimeJsonStore(STORE_KEY, STORE_FILE, DEFAULTS);
}

export async function resolveSourceConversionMapping(sourceType: PaidMediaSourceType, clientId?: string | null): Promise<ResolvedSourceConversionMapping> {
  const mappings = await listSourceConversionMappings();
  const clientMapping = mappings.find(m => m.enabled && m.sourceType === sourceType && m.scope === "client" && clientId && m.clientId === clientId);
  const globalMapping = mappings.find(m => m.enabled && m.sourceType === sourceType && m.scope === "global");
  const mapping = clientMapping ?? globalMapping;

  if (!mapping) {
    return { sourceType, purchasesEvent: null, purchaseValueEvent: null, status: "missing_mapping" };
  }

  if (!mapping.purchasesEvent && !mapping.purchaseValueEvent) {
    return { sourceType, purchasesEvent: null, purchaseValueEvent: null, status: "missing_mapping" };
  }

  if (!mapping.purchasesEvent) {
    return { sourceType, purchasesEvent: null, purchaseValueEvent: mapping.purchaseValueEvent, status: "missing_purchase_mapping" };
  }

  if (!mapping.purchaseValueEvent) {
    return { sourceType, purchasesEvent: mapping.purchasesEvent, purchaseValueEvent: null, status: "missing_purchase_value_mapping" };
  }

  return {
    sourceType,
    purchasesEvent: mapping.purchasesEvent,
    purchaseValueEvent: mapping.purchaseValueEvent,
    status: "mapped",
  };
}

export async function saveSourceConversionMappings(mappings: SourceConversionMapping[]) {
  await writeRuntimeJsonStore(STORE_KEY, STORE_FILE, mappings);
}

export async function upsertSourceConversionMapping(
  mapping: Omit<SourceConversionMapping, "updatedAt">
) {
  const mappings = await listSourceConversionMappings();
  const updated: SourceConversionMapping = {
    ...mapping,
    clientId: mapping.scope === "global" ? null : mapping.clientId,
    updatedAt: new Date().toISOString(),
  };
  const next = [
    updated,
    ...mappings.filter(
      (item) =>
        !(
          item.sourceType === updated.sourceType &&
          item.scope === updated.scope &&
          item.clientId === updated.clientId
        )
    ),
  ];
  await saveSourceConversionMappings(next);
  return updated;
}
