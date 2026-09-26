import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PUBLIC_ASSET_ROOT } from "./config";

function assetPath(publicPath: string) {
  return path.join(process.cwd(), PUBLIC_ASSET_ROOT, publicPath.replace(/^\//, ""));
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!);
}

/**
 * Network-safe fallback used only when the configured AI provider is unreachable.
 * It creates a real, unique result from the selected character, mutation and world
 * instead of returning a broken image or pretending that a provider URL exists.
 */
export async function createLocalComposite(opts: {
  characterImage: string;
  mutationImage: string;
  worldImage: string;
  characterName: string;
  mutationName: string;
  worldName: string;
}): Promise<string> {
  const [character, mutation, world] = await Promise.all([
    readFile(assetPath(opts.characterImage)),
    readFile(assetPath(opts.mutationImage)),
    readFile(assetPath(opts.worldImage)),
  ]);

  const backdrop = await sharp(world)
    .resize(1024, 1024, { fit: "cover" })
    .blur(7)
    .modulate({ brightness: 0.72, saturation: 1.25 })
    .png()
    .toBuffer();
  const hero = await sharp(character)
    .resize(720, 760, { fit: "contain", withoutEnlargement: true })
    .png()
    .toBuffer();
  const effect = await sharp(mutation)
    .resize(300, 300, { fit: "contain", withoutEnlargement: true })
    .png()
    .toBuffer();

  const title = `${opts.worldName} ${opts.mutationName} ${opts.characterName}`;
  const caption = Buffer.from(`
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#39ff14"/><stop offset=".55" stop-color="#22d3ee"/><stop offset="1" stop-color="#ff2d8a"/></linearGradient></defs>
      <rect x="38" y="842" width="948" height="142" rx="34" fill="rgba(0,0,0,.78)" stroke="url(#g)" stroke-width="5"/>
      <text x="512" y="908" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="42" font-weight="900">${escapeXml(title)}</text>
      <text x="512" y="952" text-anchor="middle" fill="#8dff9d" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="5">MEME SLOT</text>
    </svg>`);

  const output = await sharp({ create: { width: 1024, height: 1024, channels: 4, background: "#111827" } })
    .composite([
      { input: backdrop, left: 0, top: 0 },
      { input: Buffer.from('<svg width="1024" height="1024"><rect width="1024" height="1024" fill="rgba(0,0,0,.18)"/></svg>'), left: 0, top: 0 },
      { input: hero, left: 152, top: 78 },
      { input: effect, left: 674, top: 88 },
      { input: caption, left: 0, top: 0 },
    ])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  // Persist to disk when possible; on read-only filesystems (Vercel
  // serverless) fall back to an inline data URI which the frontend can
  // render and store just as well.
  try {
    const dir = path.join(process.cwd(), PUBLIC_ASSET_ROOT, "generated");
    await mkdir(dir, { recursive: true });
    const filename = `meme-local-${Date.now()}-${Math.floor(Math.random() * 1e6)}.jpg`;
    await writeFile(path.join(dir, filename), output);
    return `/generated/${filename}`;
  } catch {
    return `data:image/jpeg;base64,${output.toString("base64")}`;
  }
}
