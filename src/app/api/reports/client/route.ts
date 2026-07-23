import { NextRequest, NextResponse } from "next/server";
import { buildClientPaidMediaReport } from "@/lib/paidMediaReportingService";
import { requireAuthenticatedUser } from "@/lib/serverAccess";
export async function GET(request: NextRequest) {
  const access = await requireAuthenticatedUser(); if (access.response) return access.response;
  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "A client ID is required." }, { status: 400 });
  return NextResponse.json(await buildClientPaidMediaReport(clientId, { datePreset: request.nextUrl.searchParams.get("datePreset") ?? undefined, since: request.nextUrl.searchParams.get("since") ?? undefined, until: request.nextUrl.searchParams.get("until") ?? undefined }));
}
