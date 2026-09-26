/**
 * Structured style/world prompt fragments.
 * Keys are style ids from src/data/styles.ts (single source of truth).
 */

export const STYLE_PROMPTS: Record<string, string> = {
  cyber:
    "neon cyberpunk city, futuristic technology, blue green magenta lights",
  space:
    "moon or alien planet, stars, space station, cinematic cosmic environment",
  street: "premium urban streetwear, graffiti, modern city environment",
  pixel: "high-end 3D world inspired by pixel game aesthetics",
  anime:
    "premium anime-inspired environment while preserving the 3D character identity",
  retro: "retro futuristic environment, 80s/90s visual references, neon nostalgia",
  dark: "dark cinematic fantasy environment, deep shadows, dramatic lighting",
  cute: "bright pastel world, soft playful atmosphere",
  degen: "chaotic internet meme environment, crypto meme culture visual references, fun energetic composition",
  future:
    "clean futuristic megacity, advanced technology, bright sci-fi environment",
};

export function getStylePrompt(styleId: string): string {
  return STYLE_PROMPTS[styleId] ?? "vibrant stylized environment";
}
