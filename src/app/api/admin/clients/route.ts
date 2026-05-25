import { NextRequest, NextResponse } from "next/server";
import {
  createClient,
  getClientById,
  listClients,
  WebsitePlatform,
} from "@/lib/clientStore";

const allowedPlatforms = new Set<WebsitePlatform>([
  "shopify",
  "wordpress",
  "salla",
  "wix",
  "custom",
]);

export async function GET(request: NextRequest) {
  const requestedClientId = request.nextUrl.searchParams.get("clientId");
  const [clients, activeClient] = await Promise.all([
    listClients(),
    getClientById(requestedClientId),
  ]);

  return NextResponse.json({
    clients,
    activeClientId: activeClient.id,
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    websitePlatform?: WebsitePlatform;
    notes?: string;
  };

  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Client name is required." },
      { status: 400 }
    );
  }

  const websitePlatform = allowedPlatforms.has(
    body.websitePlatform ?? "custom"
  )
    ? (body.websitePlatform as WebsitePlatform)
    : "custom";

  const client = await createClient({
    name,
    websitePlatform,
    notes: body.notes,
  });

  return NextResponse.json({ client }, { status: 201 });
}
