"use client";

import { motion } from "framer-motion";
import type { Character } from "@/data/characters";

interface Props {
  character: Character;
  selected: boolean;
  onSelect: () => void;
}

export default function CharacterCard({ character, selected, onSelect }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className="group relative shrink-0 snap-start overflow-hidden bg-white transition-all duration-200 ease-out hover:-translate-y-1"
      style={{
        width: 120,
        height: 155,
        borderRadius: 20,
        border: selected ? "2px solid #55FF6A" : "1px solid #E8E8E8",
        boxShadow: selected
          ? "0 0 0 3px rgba(85,255,106,.15), 0 10px 35px rgba(85,255,106,.25)"
          : "0 2px 8px rgba(15,23,42,0.05)",
        transform: selected ? "scale(1.03)" : undefined,
      }}
    >
      <div className="flex h-full w-full flex-col items-center pt-2">
        <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={character.image}
            alt={character.name}
            draggable={false}
            className="h-full w-full object-contain transition-transform duration-200 ease-out group-hover:scale-[1.03]"
          />
        </div>
        <div className="w-full shrink-0 pb-2.5 pt-1 text-center text-[11px] font-extrabold tracking-[0.12em] text-[#17181c]">
          {character.name}
        </div>
      </div>

      {/* selected badge */}
      {selected && (
        <div
          className="absolute inset-x-3 bottom-2 rounded-full py-[3px] text-center text-[8px] font-black tracking-[0.22em] text-[#04220a]"
          style={{ background: "#55FF6A" }}
        >
          SELECTED
        </div>
      )}

      {/* check icon */}
      {selected && (
        <span
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black text-[#04220a]"
          style={{ background: "#55FF6A", boxShadow: "0 0 10px rgba(85,255,106,.6)" }}
        >
          ✓
        </span>
      )}
    </motion.button>
  );
}
