import { NextRequest, NextResponse } from "next/server";
import { listClients } from "@/lib/clientStore";
import { buildClientPaidMediaReport } from "@/lib/paidMediaReportingService";
import { summarizePortfolioPaidMedia } from "@/lib/portfolioReporting";
import { requireClientManagementAccess } from "@/lib/serverAccess";
export async function GET(request: NextRequest) {
  const access = await requireClientManagementAccess(); if (access.response) return access.response;
  const dateRange = { datePreset: request.nextUrl.searchParams.get("datePreset") ?? undefined, since: request.nextUrl.searchParams.get("since") ?? undefined, until: request.nextUrl.searchParams.get("until") ?? undefined };
  const reports = await Promise.all((await listClients()).map((client) => buildClientPaidMediaReport(client.id, dateRange)));
  return NextResponse.json({ ...summarizePortfolioPaidMedia(reports), dateRange, implementationStatus: "implemented_awaiting_live_validation" });
}
