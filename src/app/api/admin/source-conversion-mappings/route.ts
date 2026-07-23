import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import type { PaidMediaSourceType } from "@/lib/paidMediaContract";
import {
  listSourceConversionMappings,
  resolveSourceConversionMapping,
  upsertSourceConversionMapping,
} from "@/lib/sourceConversionMappingStore";
import { requireClientManagementAccess } from "@/lib/serverAccess";

const sources = new Set<PaidMediaSourceType>(["meta", "tiktok", "google", "snap"]);

export async function GET(request: NextRequest) {
  const access = await requireClientManagementAccess();
  if (access.response) return access.response;
  const clientId = request.nextUrl.searchParams.get("clientId");
  if (clientId) await getRequiredClientById(clientId);
  const mappings = await listSourceConversionMappings();
  const resolved = await Promise.all(
    [...sources].map((sourceType) => resolveSourceConversionMapping(sourceType, clientId))
  );
  return NextResponse.json({ mappings, resolved });
}

export async function PUT(request: NextRequest) {
  const access = await requireClientManagementAccess();
  if (access.response) return access.response;
  const body = (await request.json().catch(() => ({}))) as {
    sourceType?: PaidMediaSourceType;
    scope?: "global" | "client";
    clientId?: string | null;
    purchasesEvent?: string | null;
    purchaseValueEvent?: string | null;
    enabled?: boolean;
  };
  if (!body.sourceType || !sources.has(body.sourceType)) {
    return NextResponse.json({ error: "A supported source type is required." }, { status: 400 });
  }
  const scope = body.scope === "client" ? "client" : "global";
  const clientId = scope === "client" ? body.clientId?.trim() || null : null;
  if (scope === "client" && !clientId) {
    return NextResponse.json({ error: "Client mappings require a client ID." }, { status: 400 });
  }
  if (clientId) await getRequiredClientById(clientId);
  const mapping = await upsertSourceConversionMapping({
    sourceType: body.sourceType,
    scope,
    clientId,
    purchasesEvent: body.purchasesEvent?.trim() || null,
    purchaseValueEvent: body.purchaseValueEvent?.trim() || null,
    enabled: body.enabled !== false,
  });
  const resolved = await resolveSourceConversionMapping(body.sourceType, clientId);
  return NextResponse.json({ mapping, resolved });
}
