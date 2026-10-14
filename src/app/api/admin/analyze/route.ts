import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { generateProductFromImage } from "@/lib/ai";
import { logError } from "@/lib/logger";
import {
  enforceRateLimit,
  rateLimiters,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Limit AI requests per authenticated admin.
    const rateLimitResponse = await enforceRateLimit(
      rateLimiters.aiAnalyzer,
      session.user.id
    );

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { imageDataUrl } = await req.json();

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return NextResponse.json(
        { error: "imageDataUrl is required" },
        { status: 400 }
      );
    }

    const suggestion = await generateProductFromImage(imageDataUrl);

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    logError(error, { route: "/api/admin/analyze" });

    if (error?.message?.includes("Gemini_API_KEY")) {
      return NextResponse.json(
        {
          error:
            "AI is not configured. Please add GEMINI_API_KEY to .env.",
        },
        { status: 500 }
      );
    }

    const status = error?.status ?? error?.error?.code;

    if (
      status === 429 ||
      status === 500 ||
      status === 502 ||
      status === 503 ||
      status === 504
    ) {
      return NextResponse.json(
        {
          error:
            "The AI service is temporarily busy. Please try again.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze image with AI." },
      { status: 500 }
    );
  }
}
