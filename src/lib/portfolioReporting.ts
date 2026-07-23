export function summarizePortfolioPaidMedia(reports: Array<{
  client: { id: string; name: string; currencyCode: string };
  rows: unknown[];
  blended: unknown;
  channels: unknown[];
  issues: unknown[];
}>) {
  return {
    clients: reports.map((report) => ({ clientId: report.client.id, clientName: report.client.name, currencyCode: report.client.currencyCode, blended: report.blended, channels: report.channels, issues: report.issues })),
    summary: {
      clients: reports.length,
      reportingClients: reports.filter((report) => report.rows.length > 0).length,
      clientsNeedingAction: reports.filter((report) => report.issues.length > 0).length,
    },
  };
}
