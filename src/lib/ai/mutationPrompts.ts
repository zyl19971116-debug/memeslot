/**
 * Structured mutation prompt fragments.
 * Keys are mutation ids from src/data/mutations.ts (single source of truth).
 */

export const MUTATION_PROMPTS: Record<string, string> = {
  "laser-eyes":
    "bright glowing laser eyes, red energy beams, subtle eye light bloom",
  gold: "luxury metallic gold details, gold accessories, rich golden lighting",
  zombie:
    "undead transformation, damaged clothing, green supernatural glow, post-apocalyptic details",
  king: "royal crown, luxury details, regal styling, confident attitude",
  fire: "flames, orange energy, burning atmospheric effects",
  ice: "crystalline ice, frozen clothing details, blue glow, snow and frost",
  angel: "white wings, halo, bright celestial lighting",
  demon: "dark horns, red supernatural glow, dark fantasy details",
  radioactive:
    "toxic green glow, radioactive energy, mutated futuristic details",
  diamond:
    "crystal surfaces, diamond accessories, cyan reflections, luxury crystalline details",
};

export function getMutationPrompt(mutationId: string): string {
  return (
    MUTATION_PROMPTS[mutationId] ??
    "subtle mysterious supernatural transformation details"
  );
}
