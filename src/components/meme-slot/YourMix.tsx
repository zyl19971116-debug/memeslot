"use client";

import { motion } from "framer-motion";
import { CHARACTER_MAP } from "@/data/characters";
import { MUTATION_MAP } from "@/data/mutations";
import { STYLE_MAP } from "@/data/styles";
import { PLACEHOLDER_IMAGE } from "@/data/base";
import { useSlotStore } from "@/lib/slotStore";

/**
 * Result preparation panel under the three selector rows:
 * preview image | YOUR MIX chips + status | big gradient SPIN/CREATE CTA.
 */
export default function YourMix() {
  const { locks, aiImageUrl, aiStatus, phase, startSpin } = useSlotStore();

  const lockedCount = Object.values(locks).filter(Boolean).length;
  const spinning = phase === "spinning" || phase === "creating";
  const anythingLocked = lockedCount > 0;

  const char = locks.character ? CHARACTER_MAP.get(locks.character) : null;
  const mut = locks.mutation ? MUTATION_MAP.get(locks.mutation) : null;
  const style = locks.style ? STYLE_MAP.get(locks.style) : null;

  /* preview priority: latest AI result > selected character > placeholder */
  const previewImage =
    (aiStatus === "done" && aiImageUrl) || char?.image || PLACEHOLDER_IMAGE;

  const chip = (label: string | null, image: string | null, fallback: string) => (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-2xl bg-white"
        style={{ border: "1px solid #E8E8E8", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image ?? fallback}
          alt={label ?? fallback}
          className="h-[82%] w-[82%] object-contain"
          draggable={false}
        />
      </div>
      <span className="max-w-[72px] truncate text-[8.5px] font-bold tracking-[0.12em] text-black/55">
        {label ?? fallback}
      </span>
    </div>
  );

  return (
    <div
      className="mt-4 flex flex-col items-stretch gap-6 lg:flex-row lg:items-center"
      style={{
        background: "rgba(248,250,252,0.75)",
        border: "1px solid rgba(15,23,42,0.06)",
        borderRadius: 28,
        padding: "18px 22px",
      }}
    >
      {/* LEFT: large preview */}
      <div
        className="relative mx-auto w-full max-w-[220px] shrink-0 overflow-hidden lg:mx-0 lg:w-[200px]"
        style={{ borderRadius: 24, border: "1px solid rgba(15,23,42,0.08)" }}
      >
        <div className="aspect-square w-full bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="Your mix preview"
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
        {aiStatus === "done" && aiImageUrl && (
          <span
            className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[8px] font-black tracking-[0.2em] text-[#04220a]"
            style={{ background: "#55FF6A" }}
          >
            LATEST RESULT
          </span>
        )}
      </div>

      {/* CENTER: your mix */}
      <div className="min-w-0 flex-1 text-center lg:text-left">
        <div className="flex items-center justify-center gap-3 lg:justify-start">
          <h3 className="font-display text-xl tracking-tight text-[#17181c]">YOUR MIX</h3>
          <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[8.5px] font-bold tracking-[0.16em] text-black/55"
            style={{ border: "1px solid rgba(15,23,42,0.07)" }}>
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: "#39FF45",
                boxShadow: "0 0 6px rgba(85,255,106,.9)",
              }}
            />
            {anythingLocked ? "READY TO CREATE" : "FULL RANDOM MODE"}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 lg:justify-start">
          {chip(char?.name ?? null, char?.image ?? null, "PICK CHARACTER")}
          <span className="text-lg font-black text-black/25">+</span>
          {chip(mut?.name ?? null, mut?.image ?? null, "RANDOM")}
          <span className="text-lg font-black text-black/25">+</span>
          {chip(style?.name ?? null, style?.bgImage ?? style?.image ?? null, "RANDOM")}
        </div>

        <div className="mt-3 text-[10px] font-semibold tracking-[0.18em] text-black/40">
          {[
            char?.name ?? "RANDOM",
            mut?.name ?? "RANDOM",
            style?.name ?? "RANDOM",
          ].join("  +  ")}
        </div>
      </div>

      {/* RIGHT: CTA */}
      <div className="flex shrink-0 flex-col items-center gap-2 lg:w-[240px]">
        <motion.button
          whileHover={!spinning ? { scale: 1.03 } : undefined}
          whileTap={!spinning ? { scale: 0.97 } : undefined}
          onClick={startSpin}
          disabled={spinning}
          className="flex w-full items-center justify-center gap-3 rounded-full py-4 font-display text-lg tracking-[0.18em] text-[#04220a] transition-shadow disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            height: 64,
            background: spinning
              ? "#333"
              : "linear-gradient(100deg, #64FF45 0%, #22D3EE 55%, #3B82F6 120%)",
            color: spinning ? "#fff" : "#04220a",
            boxShadow: spinning
              ? "none"
              : "0 0 30px rgba(100,255,69,0.35), 0 12px 32px rgba(59,130,246,0.25)",
          }}
        >
          {spinning ? "SPINNING..." : anythingLocked ? "SPIN / CREATE" : "SPIN"}
          {!spinning && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12h14m0 0-6-6m6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </motion.button>
        <div className="text-[9px] font-bold tracking-[0.28em] text-black/35">
          INFINITE COMBINATIONS AWAIT
        </div>
      </div>
    </div>
  );
}
