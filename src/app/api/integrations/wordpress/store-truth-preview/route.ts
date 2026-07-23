import { NextResponse } from "next/server";
import {
  fetchWordPressStoreTruthPreview,
  getWordPressConfig,
} from "@/lib/integrations/wordpress";
import { requireAdminAccess } from "@/lib/serverAccess";

export async function GET() {
  const access = await requireAdminAccess();
  if (access.response) return access.response;
  try {
    const config = getWordPressConfig();

    if (config.missingEnv.length > 0) {
      return NextResponse.json(
        {
          error:
            "WordPress is not configured yet. Add the site URL and WooCommerce API keys first.",
          missingEnv: config.missingEnv,
        },
        { status: 400 }
      );
    }

    const preview = await fetchWordPressStoreTruthPreview();

    return NextResponse.json({
      ...preview,
      note:
        "This is store-truth preview data from the official WooCommerce REST API for the last 7 days. Sessions and funnel-stage metrics still need GA4 or another analytics source.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load WordPress store truth preview.",
      },
      { status: 500 }
    );
  }
}
