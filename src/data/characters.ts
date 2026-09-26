import { assetUrl } from "./base";

export interface Character {
  id: string;
  name: string;
  image: string;
}

export const CHARACTERS: Character[] = [
  { id: "pepe", name: "PEPE", image: assetUrl("characters", "pepe.png") },
  { id: "doge", name: "DOGE", image: assetUrl("characters", "doge.png") },
  { id: "pengu", name: "PENGU", image: assetUrl("characters", "pengu.png") },
  { id: "cat", name: "CAT", image: assetUrl("characters", "cat.png") },
  { id: "bear", name: "BEAR", image: assetUrl("characters", "bear.png") },
  { id: "bull", name: "BULL", image: assetUrl("characters", "bull.png") },
  { id: "ai", name: "AI", image: assetUrl("characters", "ai.png") },
  { id: "unicorn", name: "UNICORN", image: assetUrl("characters", "unicorn.png") },
  { id: "moon", name: "MOON", image: assetUrl("characters", "moon.png") },
  { id: "rocket", name: "ROCKET", image: assetUrl("characters", "rocket.png") },
  { id: "trump", name: "TRUMP", image: assetUrl("characters", "trump.png") },
];

export const CHARACTER_MAP = new Map(CHARACTERS.map((c) => [c.id, c]));
