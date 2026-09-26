import { CHARACTERS, CHARACTER_MAP } from "@/data/characters";
import { MUTATIONS, MUTATION_MAP } from "@/data/mutations";
import { STYLES, STYLE_MAP } from "@/data/styles";
import { SPECIAL_COMBOS } from "@/data/combinations";
import type { Rarity } from "@/data/base";
import { assetUrl } from "@/data/base";
import { resolveCombo } from "./comboResolver";

/* ---------------------------------- types --------------------------------- */

export interface SpinInput {
  lockedCharacter?: string | null;
  lockedMutation?: string | null;
  lockedStyle?: string | null;
  /** special combo id ("01".."10") — dev/test forcing */
  forcedCombo?: string | null;
}

export interface SpinResult {
  characterId: string;
  mutationId: string;
  styleId: string;
  characterName: string;
  mutationName: string;
  styleName: string;
  specialCombo: string | null;
  name: string;
  rarity: Rarity;
  image: string;
  description: string;
  /** normal-result visual composition hints */
  mutationGlow: string;
  styleBgImage: string | null;
  styleBgGradient: string;
  comboDisplay: string;
}

/* ------------------------------- rng (seeded) ------------------------------ */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/* ------------------------------ rarity weights ----------------------------- */

const RARITY_WEIGHTS: Array<[Rarity, number]> = [
  ["COMMON", 60],
  ["RARE", 25],
  ["EPIC", 10],
  ["LEGENDARY", 4],
  ["SECRET", 1],
];

function rollRarity(rng: () => number): Rarity {
  const total = RARITY_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total;
  for (const [rarity, w] of RARITY_WEIGHTS) {
    roll -= w;
    if (roll <= 0) return rarity;
  }
  return "COMMON";
}

/* --------------------------- normal result naming -------------------------- */

const LEGENDARY_ART: Record<string, string> = {
  pepe: assetUrl("results", "legendary-pepe.png"),
  doge: assetUrl("results", "legendary-doge.png"),
  pengu: assetUrl("results", "legendary-pengu.png"),
};

const MUTANT_ART = assetUrl("results", "mutant-random.png");

const DESCRIPTION_TEMPLATES = [
  (c: string, m: string, s: string) => `${c} absorbed ${m.toLowerCase()} energy and woke up in the ${s.toLowerCase()} timeline.`,
  (c: string, m: string, s: string) => `Somewhere between ${s.toLowerCase()} and chaos, ${c} found ${m.toLowerCase()} power.`,
  (c: string, m: string, s: string) => `They said ${c} could not get stranger. Then came the ${m.toLowerCase()} era.`,
  (c: string, m: string, s: string) => `${c} runs on ${m.toLowerCase()} energy in a ${s.toLowerCase()} world. Absolute unit.`,
  (c: string, m: string, s: string) => `A ${s.toLowerCase()} legend was born the moment ${c} went ${m.toLowerCase()}.`,
];

/* --------------------------------- engine --------------------------------- */

export function spin(input: SpinInput, seed: number): SpinResult {
  const rng = mulberry32(seed);

  let characterId: string;
  let mutationId: string;
  let styleId: string;
  let combo = null as ReturnType<typeof resolveCombo>;

  const forced = input.forcedCombo
    ? SPECIAL_COMBOS.find((c) => c.id === input.forcedCombo) ?? null
    : null;

  if (forced) {
    characterId = forced.characterId;
    mutationId = forced.mutationId;
    styleId = forced.styleId ?? pick(STYLES, rng).id;
    combo = forced;
  } else {
    characterId =
      input.lockedCharacter ?? pick(CHARACTERS, rng).id;
    mutationId = input.lockedMutation ?? pick(MUTATIONS, rng).id;
    styleId = input.lockedStyle ?? pick(STYLES, rng).id;
    combo = resolveCombo(characterId, mutationId, styleId);
  }

  const character = CHARACTER_MAP.get(characterId);
  const mutation = MUTATION_MAP.get(mutationId);
  const style = STYLE_MAP.get(styleId);
  if (!character || !mutation || !style) {
    throw new Error("invalid reel values");
  }

  const rarity: Rarity = combo ? combo.rarity : rollRarity(rng);
  const name = combo ? combo.resultName : `${style.name} ${mutation.name} ${character.name}`;

  let image = character.image;
  if (combo) {
    image = combo.image;
  } else if (rarity === "SECRET") {
    image = MUTANT_ART;
  } else if (rarity === "LEGENDARY" && LEGENDARY_ART[characterId]) {
    image = LEGENDARY_ART[characterId];
  }

  const description = combo
    ? combo.description
    : pick(DESCRIPTION_TEMPLATES, rng)(character.name, mutation.name, style.name);

  return {
    characterId,
    mutationId,
    styleId,
    characterName: character.name,
    mutationName: mutation.name,
    styleName: style.name,
    specialCombo: combo ? combo.id : null,
    name,
    rarity,
    image,
    description,
    mutationGlow: mutation.glow,
    styleBgImage: style.bgImage ?? null,
    styleBgGradient: style.bgGradient,
    comboDisplay: combo && combo.styleId === null
      ? `${character.name} + ${mutation.name} + GOLD`
      : `${character.name} + ${mutation.name} + ${style.name}`,
  };
}
