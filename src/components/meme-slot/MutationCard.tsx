"use client";

import { motion } from "framer-motion";
import type { Mutation } from "@/data/mutations";

interface Props {
  mutation: Mutation;
  selected: boolean;
  onSelect: () => void;
}

export default function MutationCard({ mutation, selected, onSelect }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className="group relative shrink-0 snap-start overflow-hidden bg-white transition-all duration-200 ease-out hover:-translate-y-1"
      style={{
        width: 115,
        height: 125,
        borderRadius: 20,
        border: selected ? "2px solid #D946EF" : "1px solid #E8E8E8",
        boxShadow: selected
          ? "0 0 0 3px rgba(217,70,239,.12), 0 0 30px rgba(217,70,239,.25)"
          : "0 2px 8px rgba(15,23,42,0.05)",
        transform: selected ? "scale(1.03)" : undefined,
      }}
    >
      <div className="flex h-full w-full flex-col items-center">
        <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mutation.image}
            alt={mutation.name}
            draggable={false}
            className="h-full w-full object-contain transition-transform duration-200 ease-out group-hover:scale-[1.03]"
          />
        </div>
        <div className="w-full shrink-0 pb-2 text-center text-[9.5px] leading-tight font-extrabold tracking-[0.1em] text-[#17181c]">
          {mutation.name}
        </div>
      </div>

      {selected && (
        <>
          <div
            className="absolute inset-x-2.5 bottom-1.5 rounded-full py-[3px] text-center text-[8px] font-black tracking-[0.18em] text-white"
            style={{
              background: "linear-gradient(90deg, #D946EF, #F0ABFC)",
            }}
          >
            SELECTED
          </div>
          <span
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black text-white"
            style={{ background: "#D946EF", boxShadow: "0 0 10px rgba(217,70,239,.6)" }}
          >
            ✓
          </span>
        </>
      )}
    </motion.button>
  );
}
