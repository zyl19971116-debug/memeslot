/**
 * SERVER-ONLY QuickRouter client (OpenAI-compatible relay).
 * Used when FAL_KEY holds a QuickRouter key (sk-...).
 *
 * Chat-image models (gemini-*-image) accept the three reference images
 * inline as base64 data URIs and return ONE new coherent image as a
 * markdown data URI inside the message content — no external storage needed.
 */
import { GENERATION_TIMEOUT_MS, QUICKROUTER_BASE_URL, QUICKROUTER_IMAGE_MODEL, PUBLIC_ASSET_ROOT } from "./config";
import { ProxyAgent, fetch as undiciFetch } from "undici";

/* ------------------------------------------------------------------ */
/* proxy-aware fetch                                                   */
/* Node's global fetch ignores the OS/system proxy. Where the AI       */
/* relay needs a proxy, set AI_PROXY_URL in .env.local; we also honor  */
/* HTTPS_PROXY/HTTP_PROXY env vars and fall back to direct.            */
/* ------------------------------------------------------------------ */

let cachedAgent: ProxyAgent | null | undefined; // undefined = not resolved yet

function proxyCandidates(): string[] {
  const list: string[] = [];
  if (process.env.AI_PROXY_URL) list.push(process.env.AI_PROXY_URL);
  for (const v of [process.env.HTTPS_PROXY, process.env.https_proxy, process.env.HTTP_PROXY, process.env.http_proxy]) {
    if (v) list.push(v);
  }
  return Array.from(new Set(list));
}

export interface ProxyFetchResult {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

/** POST JSON through a working proxy route (cached after first success). */
export async function proxyPostJson(
  url: string,
  headers: Record<string, string>,
  body: string
): Promise<ProxyFetchResult> {
  const attempts: Array<[string, ProxyAgent | undefined]> = [];

  if (cachedAgent !== undefined) {
    attempts.push([cachedAgent ? "cached-proxy" : "direct", cachedAgent ?? undefined]);
  } else {
    for (const proxy of proxyCandidates()) {
      attempts.push([proxy.replace("http://", ""), new ProxyAgent(proxy)]);
    }
    attempts.push(["direct", undefined]); // direct connection as last resort
  }

  let lastError: unknown = null;
  for (const [label, dispatcher] of attempts) {
    try {
      console.log(`[MEME AI] Connection route: ${label}`);
      const res = await undiciFetch(url, {
        method: "POST",
        headers,
        body,
        dispatcher,
        signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      });
      console.log(`[MEME AI] Route ${label} -> HTTP ${res.status}`);
      if (cachedAgent === undefined) cachedAgent = dispatcher ?? null;
      return res as ProxyFetchResult;
    } catch (err) {
      const cause =
        err instanceof Error && err.cause ? String(err.cause).slice(0, 120) : "";
      console.log(`[MEME AI] Route ${label} failed: ${err instanceof Error ? err.message : String(err)} ${cause}`);
      lastError = err;
      // connection-level failures → try next route; HTTP errors surface directly
      const isNetworkError =
        err instanceof Error &&
        (err.message.includes("fetch failed") ||
          err.message.includes("Connect") ||
          err.message.includes("timeout") ||
          err.message.includes("cancel"));
      if (!isNetworkError) throw err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All connection routes failed");
}

/** Read a local public asset and return it as a base64 data URI. */
export async function readAssetDataUri(publicPath: string): Promise<string> {
  const nodeFs = await import("node:fs/promises");
  const nodePath = await import("node:path");
  const normalized = publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
  const filePath = nodePath.join(process.cwd(), PUBLIC_ASSET_ROOT, normalized);
  const buffer = await nodeFs.readFile(filePath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

/** Extract the first image (data URI or hosted URL) from the model reply. */
function extractImageFromContent(content: string): string | null {
  const markdown = content.match(/!\[[^\]]*\]\((data:image\/[^)\s]+)\)/);
  if (markdown) return markdown[1];
  const dataUri = content.match(/(data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+)/);
  if (dataUri) return dataUri[1];
  const hosted = content.match(
    /(https?:\/\/[^\s)"']+\.(?:png|jpe?g|webp)[^\s)"']*)/
  );
  return hosted ? hosted[1] : null;
}

/** Persist a data-URI image into /public/generated and return its public path. */
async function persistDataUri(dataUri: string): Promise<string> {
  const nodeFs = await import("node:fs/promises");
  const nodePath = await import("node:path");
  const dir = nodePath.join(process.cwd(), PUBLIC_ASSET_ROOT, "generated");
  await nodeFs.mkdir(dir, { recursive: true });

  const ext = dataUri.startsWith("data:image/png") ? "png" : "jpg";
  const file = `meme-${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
  const base64 = dataUri.slice(dataUri.indexOf(",") + 1);
  await nodeFs.writeFile(
    nodePath.join(dir, file),
    Buffer.from(base64, "base64")
  );
  return `/generated/${file}`;
}

export interface QuickRouterResult {
  imageUrl: string; // public path (/generated/...) or hosted URL
  model: string;
}

export async function generateMemeQuickRouter(opts: {
  prompt: string;
  /** [0]=character, [1]=mutation, [2]=world (data URIs) */
  imageUris: string[];
}): Promise<QuickRouterResult> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("MISSING_KEY");

  const contentParts = [
    { type: "text", text: opts.prompt },
    ...opts.imageUris.map((url) => ({
      type: "image_url" as const,
      image_url: { url },
    })),
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  try {
    const res = await proxyPostJson(
      `${QUICKROUTER_BASE_URL}/chat/completions`,
      {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      JSON.stringify({
        model: QUICKROUTER_IMAGE_MODEL,
        messages: [{ role: "user", content: contentParts }],
      })
    );

    if (res.status === 401 || res.status === 403) {
      throw new Error("KEY_REJECTED");
    }
    if (res.status === 429) {
      throw new Error("RATE_LIMITED");
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.log(`[MEME AI] QuickRouter error ${res.status}: ${body.slice(0, 200)}`);
      throw new Error("PROVIDER_ERROR");
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content =
      typeof data.choices?.[0]?.message?.content === "string"
        ? data.choices[0].message.content
        : JSON.stringify(data.choices?.[0]?.message?.content ?? "");

    const image = extractImageFromContent(content);
    if (!image) throw new Error("NO_IMAGE");

    // data URIs are saved to /public/generated so the URL stays small,
    // shareable and localStorage-friendly; hosted URLs are returned as-is.
    const imageUrl = image.startsWith("data:")
      ? await persistDataUri(image)
      : image;

    return { imageUrl, model: QUICKROUTER_IMAGE_MODEL };
  } finally {
    clearTimeout(timer);
  }
}
