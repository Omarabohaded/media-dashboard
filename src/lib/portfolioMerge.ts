export function mergePortfolioPaidMedia<
  TCard extends {
    clientId: string;
    currencyCode: string;
    storeConnected: boolean;
    metaConnected: boolean;
    adSpend: number | null;
    roas: number | null;
    metaSourceLabel: string;
    issues: string[];
    status: "ready" | "partial" | "blocked";
  },
>(cards: TCard[], paidClients: Array<{
  clientId: string;
  blended: { spend: number; roas?: number };
  channels: Array<{ sourceType: string }>;
  issues: Array<{ sourceType: string; message: string }>;
}>) {
  const merged = cards.map((card) => {
    const paid = paidClients.find((item) => item.clientId === card.clientId);
    if (!paid) return card;
    const connected = paid.channels.length > 0;
    return {
      ...card,
      adSpend: paid.blended.spend,
      roas: paid.blended.roas ?? null,
      metaConnected: connected,
      metaSourceLabel:
        paid.channels.map((item) => item.sourceType).join(" + ") ||
        "Paid media unavailable",
      issues: [
        ...card.issues.filter(
          (issue) => !issue.startsWith("Meta is not connected")
        ),
        ...paid.issues.map((issue) => `${issue.sourceType}: ${issue.message}`),
      ],
      status: card.storeConnected && connected
        ? "ready" as const
        : card.storeConnected || connected
          ? "partial" as const
          : "blocked" as const,
    };
  });

  return {
    cards: merged,
    summary: {
      totalStores: merged.length,
      readyStores: merged.filter((card) => card.status === "ready").length,
      partialStores: merged.filter((card) => card.status === "partial").length,
      blockedStores: merged.filter((card) => card.status === "blocked").length,
      currencies: [...new Set(merged.map((card) => card.currencyCode))].sort(),
    },
  };
}
