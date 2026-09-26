/**
 * SERVER-ONLY asset upload helper.
 * Local /public assets are not reachable by fal.ai, so we read them from
 * disk and upload to fal storage, returning a temporary public URL.
 * Results are cached in-memory so PEPE is uploaded only once per server run.
 */
import { fal } from "./falClient";
import { PUBLIC_ASSET_ROOT } from "./config";

const cache = new Map<string, string>();

/**
 * Upload a local public asset (e.g. "/assets/meme-slot/characters/pepe.png")
 * to fal storage and return a fal-hosted URL. Cached by asset path.
 */
export async function uploadAsset(publicPath: string): Promise<string> {
  const normalized = publicPath.startsWith("/")
    ? publicPath
    : `/${publicPath}`;

  const cached = cache.get(normalized);
  if (cached) return cached;

  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const filePath = path.join(process.cwd(), PUBLIC_ASSET_ROOT, normalized);
  const buffer = await fs.readFile(filePath);

  const blob = new File([new Uint8Array(buffer)], path.basename(filePath), {
    type: "image/png",
  });
  const url = await fal.storage.upload(blob);

  cache.set(normalized, url);
  return url;
}

/** Test-only: clear the upload cache. */
export function clearUploadCache(): void {
  cache.clear();
}
