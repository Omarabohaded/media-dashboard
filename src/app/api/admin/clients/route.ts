import { NextRequest, NextResponse } from "next/server";
import {
  createClient,
  deleteClient,
  getClientStoreMeta,
  getClientById,
  listClients,
  updateClientStoreAccess,
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
  const [clients, activeClient, storage] = await Promise.all([
    listClients(),
    getClientById(requestedClientId),
    Promise.resolve(getClientStoreMeta()),
  ]);

  return NextResponse.json({
    clients,
    activeClientId: activeClient.id,
    storage,
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

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    storeAccessDeclined?: boolean;
  };

  const clientId = body.clientId?.trim() ?? "";

  if (!clientId) {
    return NextResponse.json(
      { error: "Client ID is required." },
      { status: 400 }
    );
  }

  if (typeof body.storeAccessDeclined !== "boolean") {
    return NextResponse.json(
      { error: "storeAccessDeclined must be true or false." },
      { status: 400 }
    );
  }

  try {
    const client = await updateClientStoreAccess({
      clientId,
      storeAccessDeclined: body.storeAccessDeclined,
    });

    return NextResponse.json({ client });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update the client access state.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const clientId =
    request.nextUrl.searchParams.get("clientId") ||
    ((await request.json().catch(() => ({}))) as { clientId?: string }).clientId ||
    "";

  if (!clientId.trim()) {
    return NextResponse.json(
      { error: "Client ID is required." },
      { status: 400 }
    );
  }

  try {
    await deleteClient(clientId.trim());
    const clients = await listClients();

    return NextResponse.json({
      ok: true,
      deletedClientId: clientId.trim(),
      clients,
      activeClientId: clients[0]?.id ?? "",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete the client.",
      },
      { status: 400 }
    );
  }
}
