import { assetUrl } from "./base";

export interface Mutation {
  id: string;
  name: string;
  image: string;
  /** glow color used when composing normal result visuals */
  glow: string;
}

export const MUTATIONS: Mutation[] = [
  { id: "laser-eyes", name: "LASER EYES", image: assetUrl("mutations", "laser-eyes.png"), glow: "#FF3B3B" },
  { id: "gold", name: "GOLD", image: assetUrl("mutations", "gold.png"), glow: "#FFC53D" },
  { id: "zombie", name: "ZOMBIE", image: assetUrl("mutations", "zombie.png"), glow: "#7ED957" },
  { id: "king", name: "KING", image: assetUrl("mutations", "king.png"), glow: "#FFB800" },
  { id: "fire", name: "FIRE", image: assetUrl("mutations", "fire.png"), glow: "#FF7A1A" },
  { id: "ice", name: "ICE", image: assetUrl("mutations", "ice.png"), glow: "#5AC8FF" },
  { id: "angel", name: "ANGEL", image: assetUrl("mutations", "angel.png"), glow: "#EFE7FF" },
  { id: "demon", name: "DEMON", image: assetUrl("mutations", "demon.png"), glow: "#E0306B" },
  { id: "radioactive", name: "RADIOACTIVE", image: assetUrl("mutations", "radioactive.png"), glow: "#7CFF3C" },
  { id: "diamond", name: "DIAMOND", image: assetUrl("mutations", "diamond.png"), glow: "#7FF7F7" },
];

export const MUTATION_MAP = new Map(MUTATIONS.map((m) => [m.id, m]));
