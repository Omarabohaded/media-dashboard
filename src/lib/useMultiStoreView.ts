"use client";

import { useEffect, useState } from "react";
import { useDashboardDate } from "@/components/AppShell";
import type { ClientCurrencyCode, WebsitePlatform } from "@/lib/clientTypes";

export type MultiStoreCard = {
  clientId: string;
  storeName: string;
  websitePlatform: WebsitePlatform;
  currencyCode: ClientCurrencyCode;
  adSpend: number | null;
  websiteSales: number | null;
  roas: number | null;
  orders: number | null;
  aov: number | null;
  costPerOrder: number | null;
  status: "ready" | "partial" | "blocked";
  storeConnected: boolean;
  metaConnected: boolean;
  storeSourceLabel: string;
  metaSourceLabel: string;
  issues: string[];
};

export type MultiStoreSummary = {
  totalStores: number;
  readyStores: number;
  partialStores: number;
  blockedStores: number;
  currencies: ClientCurrencyCode[];
};

type MultiStoreResponse = {
  cards: MultiStoreCard[];
  summary: MultiStoreSummary;
  error?: string;
};

const EMPTY_SUMMARY: MultiStoreSummary = {
  totalStores: 0,
  readyStores: 0,
  partialStores: 0,
  blockedStores: 0,
  currencies: [],
};

export function useMultiStoreView() {
  const { metaPreviewQuery } = useDashboardDate();
  const [cards, setCards] = useState<MultiStoreCard[]>([]);
  const [summary, setSummary] = useState<MultiStoreSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/dashboard/multi-store-view?${metaPreviewQuery}`,
          {
            cache: "no-store",
          }
        );
        const payload = (await response.json()) as MultiStoreResponse;

        if (!response.ok) {
          throw new Error(
            payload.error ?? "Could not load the portfolio-level store comparison."
          );
        }

        if (cancelled) {
          return;
        }

        setCards(payload.cards ?? []);
        setSummary(payload.summary ?? EMPTY_SUMMARY);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setCards([]);
        setSummary(EMPTY_SUMMARY);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load the portfolio-level store comparison."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [metaPreviewQuery, refreshNonce]);

  return {
    cards,
    summary,
    isLoading,
    error,
    refresh: () => setRefreshNonce((current) => current + 1),
  };
}
