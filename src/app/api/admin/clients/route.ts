import { NextRequest, NextResponse } from "next/server";
import {
  createClient,
  deleteClient,
  getClientStoreMeta,
  getClientStoreHealth,
  listClients,
  updateClient,
  updateClientStoreAccess,
} from "@/lib/clientStore";
import { getVisibleClientsForUser } from "@/lib/accessControl";
import {
  requireAuthenticatedUser,
  requireClientManagementAccess,
} from "@/lib/serverAccess";
import {
  type ClientCurrencyCode,
  SUPPORTED_CLIENT_CURRENCIES,
  type WebsitePlatform,
} from "@/lib/clientTypes";
import { clearTikTokConnection } from "@/lib/tiktokConnectionStore";
import { clearGoogleAdsConnection } from "@/lib/googleAdsConnectionStore";

const allowedPlatforms = new Set<WebsitePlatform>([
  "shopify",
  "woocommerce",
  "wordpress",
  "salla",
  "wix",
  "custom",
]);

export async function GET(request: NextRequest) {
  const access = await requireAuthenticatedUser();
  if (access.response) return access.response;

  const requestedClientId = request.nextUrl.searchParams.get("clientId");
  const [allClients, storage, storageHealth] = await Promise.all([
    listClients(),
    Promise.resolve(getClientStoreMeta()),
    getClientStoreHealth(),
  ]);
  const clients = await getVisibleClientsForUser(access.user, allClients);
  const requestedClient = requestedClientId
    ? clients.find((client) => client.id === requestedClientId)
    : null;
  const activeClient = requestedClient ?? clients[0] ?? null;

  return NextResponse.json({
    clients,
    activeClientId: activeClient?.id ?? "",
    storage,
    storageHealth,
  });
}

export async function POST(request: NextRequest) {
  const access = await requireClientManagementAccess();
  if (access.response) return access.response;

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
  const access = await requireClientManagementAccess();
  if (access.response) return access.response;

  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    storeAccessDeclined?: boolean;
    name?: string;
    websitePlatform?: WebsitePlatform;
    currencyCode?: ClientCurrencyCode;
    notes?: string;
  };

  const clientId = body.clientId?.trim() ?? "";

  if (!clientId) {
    return NextResponse.json(
      { error: "Client ID is required." },
      { status: 400 }
    );
  }

  try {
    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: "Client name is required." }, { status: 400 });
      }
      const websitePlatform = allowedPlatforms.has(body.websitePlatform ?? "custom")
        ? (body.websitePlatform as WebsitePlatform)
        : "custom";
      const allowedCurrencies = new Set(SUPPORTED_CLIENT_CURRENCIES.map((item) => item.code));
      const currencyCode = allowedCurrencies.has(body.currencyCode ?? "USD")
        ? (body.currencyCode as ClientCurrencyCode)
        : "USD";
      const client = await updateClient({
        clientId,
        name,
        websitePlatform,
        currencyCode,
        notes: body.notes,
      });
      return NextResponse.json({ client });
    }
    if (typeof body.storeAccessDeclined !== "boolean") {
      return NextResponse.json(
        { error: "Provide client fields or storeAccessDeclined." },
        { status: 400 }
      );
    }
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
  const access = await requireClientManagementAccess();
  if (access.response) return access.response;

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
    await Promise.all([
      clearTikTokConnection(clientId.trim()),
      clearGoogleAdsConnection(clientId.trim()),
    ]);
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
