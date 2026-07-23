import { NextRequest, NextResponse } from "next/server";
import {
  fetchWordPressStoreTruthPreview,
  getWordPressConfig,
  validateWordPressStoreConnection,
  WORDPRESS_CONNECTED_COOKIE,
} from "@/lib/integrations/wordpress";
import { requireAdminAccess } from "@/lib/serverAccess";

export async function GET(request: NextRequest) {
  const access = await requireAdminAccess();
  if (access.response) return access.response;
  const config = getWordPressConfig();
  const hasCookie = request.cookies.get(WORDPRESS_CONNECTED_COOKIE)?.value === "1";
  let connectionError: string | null = null;
  let previewReady = false;
  let storeName: string | null = null;
  let currencyCode: string | null = null;

  if (config.missingEnv.length === 0) {
    try {
      const validated = await validateWordPressStoreConnection();
      storeName = validated.storeName;
      currencyCode = validated.currencyCode;

      const preview = await fetchWordPressStoreTruthPreview();
      previewReady = true;
      storeName = preview.snapshot.storeName;
      currencyCode = preview.snapshot.currencyCode;
    } catch (error) {
      connectionError =
        error instanceof Error ? error.message : "WordPress connection failed.";
    }
  }

  return NextResponse.json({
    platform: "wordpress",
    configured: config.missingEnv.length === 0,
    connected: (hasCookie || config.missingEnv.length === 0) && !connectionError,
    previewReady,
    siteUrl: config.siteUrl,
    apiVersion: config.apiVersion,
    queryStringAuth: config.queryStringAuth,
    missingEnv: config.missingEnv,
    usesMockData: true,
    storeName,
    currencyCode,
    connectionError,
    recommendedNextStep:
      config.missingEnv.length > 0
        ? "Add WordPress site URL and WooCommerce API keys first."
        : !previewReady
          ? "Validate WooCommerce keys, HTTPS setup, and permalink settings."
          : "Compare WordPress store truth against Meta before enabling live decision scoring.",
  });
}
