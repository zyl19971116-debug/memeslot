import { SPECIAL_COMBOS } from "./combinations";
import type { Creation } from "@/components/CreationCard";

const MOCK_META: Record<string, { likes: number; daysAgo: number }> = {
  "01": { likes: 4821, daysAgo: 1 },
  "02": { likes: 9102, daysAgo: 2 },
  "03": { likes: 3350, daysAgo: 3 },
  "04": { likes: 6677, daysAgo: 4 },
  "05": { likes: 15420, daysAgo: 5 },
  "06": { likes: 5210, daysAgo: 2 },
  "07": { likes: 7731, daysAgo: 6 },
  "08": { likes: 22011, daysAgo: 7 },
  "09": { likes: 8890, daysAgo: 1 },
  "10": { likes: 13337, daysAgo: 3 },
};

export const CREATIONS: Creation[] = SPECIAL_COMBOS.map((c) => ({
  id: c.id,
  name: c.resultName,
  rarity: c.rarity,
  combo:
    c.styleId === null
      ? `${c.characterId.toUpperCase()} + ${c.mutationId.toUpperCase().replace(/-/g, " ")} + GOLD`
      : `${c.characterId.toUpperCase()} + ${c.mutationId.toUpperCase().replace(/-/g, " ")} + ${c.styleId.toUpperCase()}`,
  image: c.image,
  likes: MOCK_META[c.id]?.likes ?? 0,
  daysAgo: MOCK_META[c.id]?.daysAgo ?? 9,
}));
