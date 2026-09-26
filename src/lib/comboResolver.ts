import { SPECIAL_COMBOS, type SpecialCombo } from "@/data/combinations";

/**
 * Resolve a special combo from the three reel values.
 * Combos with styleId === null (wildcard) match on character + mutation only.
 */
export function resolveCombo(
  characterId: string,
  mutationId: string,
  styleId: string
): SpecialCombo | null {
  for (const combo of SPECIAL_COMBOS) {
    if (
      combo.characterId === characterId &&
      combo.mutationId === mutationId &&
      (combo.styleId === null || combo.styleId === styleId)
    ) {
      return combo;
    }
  }
  return null;
}
