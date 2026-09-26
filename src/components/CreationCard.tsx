import RarityBadge from "./RarityBadge";
import type { Rarity } from "@/data/base";

export interface Creation {
  id: string;
  name: string;
  rarity: Rarity;
  combo: string;
  image: string;
  likes: number;
  daysAgo: number;
}

export default function CreationCard({ creation }: { creation: Creation }) {
  return (
    <div className="group overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-cardHover">
      <div className="relative aspect-square overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={creation.image}
          alt={creation.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          draggable={false}
        />
        <div className="absolute left-3 top-3">
          <RarityBadge rarity={creation.rarity} />
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="font-display text-sm tracking-tight">{creation.name}</div>
        <div className="mt-0.5 text-[10px] font-semibold tracking-[0.15em] text-black/40">
          {creation.combo}
        </div>
      </div>
    </div>
  );
}
