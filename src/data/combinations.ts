import { assetUrl } from "./base";
import type { Rarity } from "./base";

export interface SpecialCombo {
  /** two-digit combo number, also used by the dev force control */
  id: string;
  characterId: string;
  mutationId: string;
  /** null = wildcard: any style matches (combo 08's "GOLD" is a display flourish, not a reel value) */
  styleId: string | null;
  resultName: string;
  rarity: Rarity;
  image: string;
  description: string;
}

export const SPECIAL_COMBOS: SpecialCombo[] = [
  {
    id: "01",
    characterId: "pepe",
    mutationId: "laser-eyes",
    styleId: "cyber",
    resultName: "CYBER PEPE",
    rarity: "EPIC",
    image: assetUrl("creations", "cyber-pepe.png"),
    description: "Neon veins. Laser focus. This frog runs the grid.",
  },
  {
    id: "02",
    characterId: "doge",
    mutationId: "gold",
    styleId: "space",
    resultName: "SPACE DOGE",
    rarity: "EPIC",
    image: assetUrl("creations", "space-doge.png"),
    description: "One small paw for doge. One giant leap for memes.",
  },
  {
    id: "03",
    characterId: "pengu",
    mutationId: "ice",
    styleId: "future",
    resultName: "ICE PENGU",
    rarity: "RARE",
    image: assetUrl("creations", "ice-pengu.png"),
    description: "Chill is not a mood. It is a lifestyle.",
  },
  {
    id: "04",
    characterId: "cat",
    mutationId: "gold",
    styleId: "retro",
    resultName: "GOLD CAT",
    rarity: "EPIC",
    image: assetUrl("creations", "gold-cat.png"),
    description: "Nine lives. All of them shiny.",
  },
  {
    id: "05",
    characterId: "bull",
    mutationId: "fire",
    styleId: "space",
    resultName: "ROCKET BULL",
    rarity: "LEGENDARY",
    image: assetUrl("creations", "rocket-bull.png"),
    description: "Not going to the moon. Dragging the moon back.",
  },
  {
    id: "06",
    characterId: "doge",
    mutationId: "zombie",
    styleId: "dark",
    resultName: "ZOMBIE DOGE",
    rarity: "RARE",
    image: assetUrl("creations", "zombie-doge.png"),
    description: "Such bite. Very brain. Wow.",
  },
  {
    id: "07",
    characterId: "pengu",
    mutationId: "angel",
    styleId: "cute",
    resultName: "ANGEL PENGU",
    rarity: "EPIC",
    image: assetUrl("creations", "angel-pengu.png"),
    description: "Too pure for this timeline.",
  },
  {
    id: "08",
    characterId: "pepe",
    mutationId: "king",
    styleId: null,
    resultName: "KING PEPE",
    rarity: "LEGENDARY",
    image: assetUrl("creations", "king-pepe.png"),
    description: "Born to meme. Crowned to rule.",
  },
  {
    id: "09",
    characterId: "cat",
    mutationId: "diamond",
    styleId: "space",
    resultName: "MOON CAT",
    rarity: "EPIC",
    image: assetUrl("creations", "moon-cat.png"),
    description: "Nine lives. Zero gravity.",
  },
  {
    id: "10",
    characterId: "unicorn",
    mutationId: "radioactive",
    styleId: "future",
    resultName: "AI UNICORN",
    rarity: "LEGENDARY",
    image: assetUrl("creations", "ai-unicorn.png"),
    description: "Trained on dreams. Deployed in neon.",
  },
];
