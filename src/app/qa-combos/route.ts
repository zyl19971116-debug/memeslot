import { NextResponse } from "next/server";
import { spin } from "@/lib/spinEngine";
import { SPECIAL_COMBOS } from "@/data/combinations";

export const dynamic = "force-static";

/**
 * QA endpoint: verifies every special combo can be forced through the real
 * spin engine and that the reels land exactly on the combo values.
 * Combo 08 uses a wildcard style, so its style is engine-randomized.
 */
export async function GET() {
  const results = SPECIAL_COMBOS.map((c) => {
    const r = spin(
      { forcedCombo: c.id, lockedCharacter: null, lockedMutation: null, lockedStyle: null },
      20260922 + Number(c.id)
    );
    return {
      combo: c.id,
      expectName: c.resultName,
      expectRarity: c.rarity,
      gotName: r.name,
      gotRarity: r.rarity,
      characterId: r.characterId,
      mutationId: r.mutationId,
      styleId: r.styleId,
      characterMatch: r.characterId === c.characterId,
      mutationMatch: r.mutationId === c.mutationId,
      styleMatch: c.styleId === null ? true : r.styleId === c.styleId,
      image: r.image,
      pass:
        r.name === c.resultName &&
        r.rarity === c.rarity &&
        r.characterId === c.characterId &&
        r.mutationId === c.mutationId &&
        (c.styleId === null || r.styleId === c.styleId),
    };
  });

  // a few normal (unforced) spins must NOT throw and must have valid values
  const normal = [1, 7, 42].map((seed) => {
    const r = spin({}, seed * 7919);
    return {
      seed,
      name: r.name,
      rarity: r.rarity,
      comboDisplay: r.comboDisplay,
      special: r.specialCombo,
    };
  });

  return NextResponse.json({
    ok: results.every((r) => r.pass),
    results,
    normal,
  });
}
