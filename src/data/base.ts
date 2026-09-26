export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "SECRET";

export const ASSET_BASE = "/assets/meme-slot";

export function assetUrl(folder: string, file: string): string {
  return `${ASSET_BASE}/${folder}/${file}`;
}

export const PLACEHOLDER_IMAGE = assetUrl("system", "meme-placeholder.png");
