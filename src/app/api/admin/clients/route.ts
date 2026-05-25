import { NextRequest, NextResponse } from "next/server";
import {
  createClient,
  getClientById,
  listClients,
} from "@/lib/clientStore";
import {
  type ClientCurrencyCode,
  SUPPORTED_CLIENT_CURRENCIES,
  type WebsitePlatform,
} from "@/lib/clientTypes";

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
    currencyCode?: ClientCurrencyCode;
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

  const allowedCurrencies = new Set(
    SUPPORTED_CLIENT_CURRENCIES.map((item) => item.code)
  );
  const currencyCode = allowedCurrencies.has(body.currencyCode ?? "USD")
    ? (body.currencyCode as ClientCurrencyCode)
    : "USD";

  const client = await createClient({
    name,
    websitePlatform,
    currencyCode,
    notes: body.notes,
  });

  return NextResponse.json({ client }, { status: 201 });
}
