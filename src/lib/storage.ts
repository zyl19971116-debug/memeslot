import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Rarity } from "@/data/base";

export interface Discovery {
  id: string;
  character: string;
  mutation: string;
  style: string;
  resultName: string;
  rarity: Rarity;
  image: string;
  specialCombo: string | null;
  /** true when the stored image is an AI-generated result (remote URL) */
  aiGenerated?: boolean;
  timestamp: number;
}

interface DiscoveryState {
  discoveries: Discovery[];
  addDiscovery: (d: Discovery) => void;
  hasDiscovery: (id: string) => boolean;
  clearAll: () => void;
}

function fallbackStorage(): Storage {
  const mem = new Map<string, string>();
  return {
    length: 0,
    clear: () => mem.clear(),
    getItem: (k: string) => (mem.has(k) ? (mem.get(k) as string) : null),
    key: () => null,
    removeItem: (k: string) => mem.delete(k),
    setItem: (k: string, v: string) => mem.set(k, v),
  } as unknown as Storage;
}

export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set, get) => ({
      discoveries: [],
      addDiscovery: (d) =>
        set((state) =>
          state.discoveries.some((x) => x.id === d.id)
            ? state
            : { discoveries: [d, ...state.discoveries] }
        ),
      hasDiscovery: (id) => get().discoveries.some((x) => x.id === id),
      clearAll: () => set({ discoveries: [] }),
    }),
    {
      name: "meme-slot-discoveries",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : fallbackStorage()
      ),
    }
  )
);
