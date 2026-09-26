import { NextRequest, NextResponse } from "next/server";
import { generateMeme, validateInput } from "@/lib/ai/generateMeme";
import { isFalConfigured } from "@/lib/ai/falClient";
import { RATE_LIMIT_PER_MINUTE } from "@/lib/ai/config";

/**
 * POST /api/generate-meme
 * body: { character, mutation, style }  (lowercase ids from the data layer)
 *
 * The browser never touches fal.ai or FAL_KEY — everything happens here.
 */

/* ------------------------------ rate limiting ----------------------------- */

const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= RATE_LIMIT_PER_MINUTE) {
    hits.set(key, arr);
    return true;
  }
  arr.push(now);
  hits.set(key, arr);
  return false;
}

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "local";
}

/* --------------------------------- routes --------------------------------- */

/** GET — lets the UI check whether AI generation is configured. */
export async function GET() {
  return NextResponse.json({ configured: isFalConfigured() });
}

export async function POST(req: NextRequest) {
  if (isRateLimited(clientKey(req))) {
    return NextResponse.json(
      { success: false, code: "RATE_LIMITED", message: "Too many generations. Wait a moment and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, code: "INVALID_INPUT", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const input = validateInput(body);
  if (!input) {
    return NextResponse.json(
      { success: false, code: "INVALID_INPUT", message: "Unknown character, mutation or style." },
      { status: 400 }
    );
  }

  const result = await generateMeme(input);
  const status = result.success
    ? 200
    : result.code === "NOT_CONFIGURED"
      ? 503
      : result.code === "INVALID_INPUT"
        ? 400
        : 500;

  return NextResponse.json(
    result.success ? { ...result, generationId: crypto.randomUUID() } : result,
    { status }
  );
}
