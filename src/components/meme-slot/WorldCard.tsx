"use client";

import { motion } from "framer-motion";
import type { Style } from "@/data/styles";

interface Props {
  style: Style;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Visual environment card: background artwork fills the whole card,
 * dark gradient at the bottom, white bold world name.
 */
export default function WorldCard({ style, selected, onSelect }: Props) {
  const art = style.bgImage ?? style.image;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className="group relative shrink-0 snap-start overflow-hidden bg-[#0e1220] transition-all duration-200 ease-out hover:-translate-y-1"
      style={{
        width: 150,
        height: 125,
        borderRadius: 18,
        border: selected ? "3px solid #00D9FF" : "1px solid #E8E8E8",
        boxShadow: selected
          ? "0 0 0 3px rgba(0,217,255,.14), 0 0 30px rgba(0,217,255,.30)"
          : "0 2px 8px rgba(15,23,42,0.08)",
        transform: selected ? "scale(1.03)" : undefined,
      }}
    >
      {/* full-bleed environment artwork */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art}
        alt={style.name}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
        style={{
          objectFit: "cover",
          background: style.bgGradient,
        }}
      />

      {/* dark gradient for legibility */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 42%, rgba(0,0,0,0.42) 68%, rgba(0,0,0,0.70) 100%)",
        }}
      />

      {/* world name */}
      <div className="absolute bottom-2 left-3 text-[13px] font-black tracking-[0.14em] text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
        {style.name}
      </div>

      {selected && (
        <>
          <div
            className="absolute bottom-2 right-2 rounded-full px-2 py-[2px] text-[8px] font-black tracking-[0.16em] text-[#04222b]"
            style={{ background: "#00D9FF" }}
          >
            SELECTED
          </div>
          <span
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black text-[#04222b]"
            style={{ background: "#00D9FF", boxShadow: "0 0 10px rgba(0,217,255,.7)" }}
          >
            ✓
          </span>
        </>
      )}
    </motion.button>
  );
}
