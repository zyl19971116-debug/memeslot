"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import RarityBadge from "./RarityBadge";
import { useSlotStore } from "@/lib/slotStore";
import PonsV2LaunchButton from "./launch/PonsV2LaunchButton";

async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    // CORS or network issue — fall back to direct navigation
    window.open(url, "_blank");
  }
}

function shareResult(name: string, combo: string) {
  const text = `${name} — ${combo} | MEME SLOT`;
  if (typeof navigator !== "undefined" && navigator.share) {
    navigator.share({ title: "MEME SLOT", text }).catch(() => {});
  } else if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

export default function ResultReveal() {
  const {
    phase,
    result,
    aiStatus,
    aiImageUrl,
    aiFallback,
    aiError,
    savedThisSpin,
    closeResult,
    startSpin,
    retryAi,
    saveToCollection,
  } = useSlotStore();

  const isAi = aiStatus === "done" && aiImageUrl !== null;
  const failed = aiStatus === "error";
  const displayImage = isAi ? aiImageUrl! : result?.image ?? "";
  const [savedFeedback, setSavedFeedback] = useState(false);

  const onSave = () => {
    saveToCollection();
    setSavedFeedback(true);
  };

  return (
    <AnimatePresence>
      {phase === "reveal" && result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={closeResult}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl"
            style={{
              boxShadow:
                result.rarity === "LEGENDARY"
                  ? "0 0 60px rgba(255,197,61,0.55), 0 30px 80px rgba(0,0,0,0.35)"
                  : result.rarity === "SECRET"
                    ? "0 0 60px rgba(255,45,138,0.5), 0 30px 80px rgba(0,0,0,0.35)"
                    : "0 30px 80px rgba(0,0,0,0.35)",
            }}
          >
            {/* visual — the AI image (or fallback) is the focus */}
            <div className="relative aspect-square w-full overflow-hidden bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt={result.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-4 top-4">
                <span className="rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold tracking-[0.25em] text-white backdrop-blur">
                  {isAi ? "NEW MEME CREATED" : "NEW MEME DISCOVERED"}
                </span>
              </div>
              <div className="absolute right-4 top-4">
                <RarityBadge rarity={result.rarity} />
              </div>
              {isAi && (
                <div className="absolute bottom-4 left-4">
                  <span
                    className="rounded-full px-3 py-1 text-[9px] font-bold tracking-[0.25em] text-[#04220a]"
                    style={{
                      background: "linear-gradient(100deg, #39ff14, #2ee66f)",
                    }}
                  >
                    {aiFallback ? "LOCALLY COMPOSED" : "AI GENERATED"}
                  </span>
                </div>
              )}
            </div>

            {/* generation failure banner */}
            {failed && (
              <div className="mx-5 mt-4 rounded-2xl border border-[#ff2d8a]/30 bg-[#ff2d8a]/5 px-4 py-3">
                <div className="text-[10px] font-bold tracking-[0.25em] text-[#e0306b]">
                  GENERATION FAILED
                </div>
                <p className="mt-1 text-xs text-black/60">
                  {aiError ?? "We couldn't create this meme."} Showing the
                  fallback visual instead.
                </p>
                <button
                  onClick={retryAi}
                  className="mt-2 rounded-full bg-black px-4 py-2 text-[10px] font-bold tracking-[0.2em] text-white transition-opacity hover:opacity-80"
                >
                  TRY AGAIN
                </button>
              </div>
            )}

            {/* info */}
            <div className="px-6 pb-6 pt-5 text-center">
              <h2 className="font-display text-2xl tracking-tight">{result.name}</h2>
              <div className="mt-1 text-xs font-semibold tracking-[0.2em] text-black/45">
                {result.comboDisplay}
              </div>
              <p className="mx-auto mt-3 max-w-xs text-sm text-black/60">
                {result.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2">
                {isAi && (
                  <PonsV2LaunchButton
                    imageUrl={displayImage}
                    suggestedName={result.name}
                    description={`${result.comboDisplay}. ${result.description}`}
                  />
                )}
                <button
                  onClick={() => {
                    closeResult();
                    startSpin();
                  }}
                  className="col-span-2 rounded-full py-3 font-display text-sm tracking-[0.2em] text-[#04220a]"
                  style={{
                    background: "linear-gradient(100deg, #39ff14 0%, #2ee66f 60%, #2e9bff 130%)",
                    boxShadow: "0 0 20px rgba(57,255,20,0.45)",
                  }}
                >
                  SPIN AGAIN
                </button>
                <button
                  onClick={() =>
                    downloadImage(
                      displayImage,
                      `${result.name.replace(/\s+/g, "-")}.png`
                    )
                  }
                  className="rounded-full border border-black/15 py-3 text-xs font-bold tracking-[0.15em] text-black transition-colors hover:bg-black hover:text-white"
                >
                  DOWNLOAD
                </button>
                <button
                  onClick={() => shareResult(result.name, result.comboDisplay)}
                  className="rounded-full border border-black/15 py-3 text-xs font-bold tracking-[0.15em] text-black transition-colors hover:bg-black hover:text-white"
                >
                  SHARE
                </button>
                <button
                  onClick={onSave}
                  disabled={savedFeedback || savedThisSpin}
                  className={`col-span-2 rounded-full py-3 text-xs font-bold tracking-[0.15em] transition-colors ${
                    savedFeedback || savedThisSpin
                      ? "cursor-default bg-[#39ff14]/20 text-[#04220a]"
                      : "bg-black text-white hover:opacity-80"
                  }`}
                >
                  {savedFeedback || savedThisSpin ? "SAVED ✓" : "SAVE TO COLLECTION"}
                </button>
                <Link
                  href="/collection"
                  onClick={closeResult}
                  className="col-span-2 rounded-full bg-black/5 py-3 text-xs font-bold tracking-[0.15em] text-black/70 transition-colors hover:bg-black/10"
                >
                  VIEW COLLECTION
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
