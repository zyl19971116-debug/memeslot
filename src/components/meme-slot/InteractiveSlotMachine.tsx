"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CHARACTERS } from "@/data/characters";
import { MUTATIONS } from "@/data/mutations";
import { STYLES } from "@/data/styles";
import { useSlotStore } from "@/lib/slotStore";
import { AI_FOR_SPECIAL_COMBOS } from "@/lib/ai/config";

/* ------------------------------------------------------------------ */
/* data                                                                */
/* ------------------------------------------------------------------ */

interface ReelEntry {
  id: string;
  name: string;
  image: string;
}

const AXES: ReelEntry[][] = [
  CHARACTERS.map(({ id, name, image }) => ({ id, name, image })),
  MUTATIONS.map(({ id, name, image }) => ({ id, name, image })),
  STYLES.map(({ id, name, image }) => ({ id, name, image })),
];

/* sequential stops: character 1200ms, mutation 1500ms, style 1800ms */
const STOP_DELAYS = [1200, 1500, 1800];

const AI_STEPS = [
  "READING CHARACTER...",
  "APPLYING MUTATION...",
  "BUILDING WORLD...",
  "GENERATING MEME...",
];

/* ------------------------------------------------------------------ */
/* single reel — viewport + vertically moving strip                    */
/* ------------------------------------------------------------------ */

function ReelWheel({
  entries,
  targetId,
  epoch,
  stopDelay,
  onStopped,
}: {
  entries: ReelEntry[];
  targetId: string | null;
  epoch: number;
  stopDelay: number;
  onStopped: () => void;
}) {
  const [strip, setStrip] = useState<ReelEntry[]>(() => [...entries]);
  const [go, setGo] = useState(false);
  const onStoppedRef = useRef(onStopped);
  onStoppedRef.current = onStopped;

  useEffect(() => {
    if (epoch === 0 || !targetId) return;
    const target = entries.find((e) => e.id === targetId) ?? entries[0];

    /* 3 full loops + the winning entry pinned at the end */
    setStrip([...entries, ...entries, ...entries, target]);
    setGo(false); // snap back to top with no transition

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setGo(true));
    });

    const timer = window.setTimeout(() => onStoppedRef.current(), stopDelay + 80);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epoch]);

  const n = Math.max(strip.length, 1);
  const endShift = ((n - 1) / n) * 100;

  return (
    <div className="reel-viewport relative h-full w-full overflow-hidden rounded-[20px]">
      <div
        className="reel-strip absolute inset-x-0 top-0"
        style={{
          height: `${n * 100}%`,
          transform: go ? `translateY(-${endShift}%)` : "translateY(0%)",
          transition: go
            ? `transform ${stopDelay}ms cubic-bezier(0.15, 0.85, 0.22, 1.04)`
            : "none",
          filter: go ? "blur(2px)" : "none",
          willChange: "transform",
        }}
      >
        {strip.map((entry, i) => (
          <div
            key={`${entry.id}-${i}`}
            className="flex w-full flex-col items-center justify-center"
            style={{ height: `${100 / n}%` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.image}
              alt={entry.name}
              className="min-h-0 w-[74%] flex-1 object-contain pt-[5%]"
              draggable={false}
            />
            <div className="w-full shrink-0 truncate px-1 pb-[6%] text-center text-[11px] font-extrabold tracking-[0.12em] text-[#17181c]">
              {entry.name}
            </div>
          </div>
        ))}
      </div>

      {/* glass sheen + top reflection */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, rgba(255,255,255,0.4) 0%, transparent 30%, transparent 75%, rgba(0,0,0,0.10) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1/4"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.55), transparent)" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* the machine                                                         */
/* ------------------------------------------------------------------ */

export default function InteractiveSlotMachine() {
  const {
    phase,
    result,
    reelTargets,
    spinEpoch,
    aiStatus,
    startSpin,
    setPhase,
    requestAi,
  } = useSlotStore();

  const [stopped, setStopped] = useState(0);
  const [flash, setFlash] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const celebrateTimer = useRef<number | null>(null);
  const leverTimer = useRef<number | null>(null);

  const spinning = phase === "spinning" || phase === "creating";
  const isLegendary = result?.rarity === "LEGENDARY";
  const isSecret = result?.rarity === "SECRET";

  /* rotating AI progress messages */
  useEffect(() => {
    if (phase !== "creating") {
      setAiStep(0);
      return;
    }
    const iv = window.setInterval(() => setAiStep((s) => (s + 1) % AI_STEPS.length), 1800);
    return () => clearInterval(iv);
  }, [phase]);

  /* reset per spin */
  useEffect(() => {
    if (spinEpoch > 0) setStopped(0);
  }, [spinEpoch]);

  /* all reels stopped -> flash -> creating -> fires AI exactly once per spin */
  useEffect(() => {
    if (spinEpoch === 0 || stopped < 3) return;
    const t1 = window.setTimeout(() => setFlash(true), 250);
    const t2 = window.setTimeout(() => {
      setFlash(false);
      setPhase("creating");
      requestAi();
    }, 250 + 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopped]);

  /* reveal timing */
  useEffect(() => {
    if (phase !== "creating") return;
    const noAi = !!result?.specialCombo && !AI_FOR_SPECIAL_COMBOS;
    if (noAi) {
      const t = window.setTimeout(() => setPhase("reveal"), 850);
      return () => clearTimeout(t);
    }
    if (aiStatus === "done" || aiStatus === "error") {
      const t = window.setTimeout(() => setPhase("reveal"), 450);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, aiStatus]);

  /* legendary / secret celebration */
  useEffect(() => {
    if (phase !== "reveal" || !result) return;
    if (result.rarity === "LEGENDARY" || result.rarity === "SECRET") {
      setCelebrate(true);
      celebrateTimer.current = window.setTimeout(() => setCelebrate(false), 1400);
    }
    return () => {
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    };
  }, [phase, result]);

  useEffect(
    () => () => {
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
      if (leverTimer.current) clearTimeout(leverTimer.current);
    },
    []
  );

  const handleSpin = () => {
    if (spinning) return;
    setLeverPulled(false);
    startSpin();
  };

  const pullLever = () => {
    if (spinning || leverPulled) return;
    setLeverPulled(true);
    startSpin();
    leverTimer.current = window.setTimeout(() => setLeverPulled(false), 550);
  };

  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: 8 + ((i * 37) % 84),
        delay: (i % 5) * 0.12,
        size: 6 + ((i * 13) % 3) * 4,
        color: i % 3 === 0 ? "#ffc53d" : i % 3 === 1 ? "#39ff14" : "#ff2d8a",
      })),
    []
  );

  const reelShadow = celebrate && isLegendary
    ? "0 0 22px rgba(255,197,61,0.9), inset 0 8px 16px rgba(0,0,0,0.08)"
    : spinning
      ? "0 0 18px rgba(80,255,110,0.55), inset 0 8px 16px rgba(0,0,0,0.08)"
      : "inset 0 8px 16px rgba(0,0,0,0.08)";

  return (
    <section
      id="machine"
      data-slot-version="interactive-v2"
      className="slot-machine relative mx-auto w-full scroll-mt-24"
      style={{ width: 720, maxWidth: "100%", minHeight: 500 }}
    >
      {/* ambient glow behind the shell */}
      <div
        className="pointer-events-none absolute -inset-12 -z-10 rounded-[72px] transition-all duration-700"
        style={{
          background: isLegendary
            ? "radial-gradient(closest-side, rgba(255,197,61,0.32), transparent 75%)"
            : isSecret
              ? "radial-gradient(closest-side, rgba(255,45,138,0.26), transparent 75%)"
              : "radial-gradient(closest-side, rgba(80,255,110,0.12), transparent 75%)",
        }}
      />

      <div className={celebrate ? "slot-shake" : ""}>
        {/* ================= MACHINE SHELL ================= */}
        <div
          className="relative select-none"
          style={{
            background:
              "linear-gradient(145deg, #ffffff 0%, #dfe4ea 25%, #ffffff 48%, #bfc7d1 72%, #f8fafc 100%)",
            border: "2px solid rgba(15,23,42,0.18)",
            borderRadius: "50px 50px 32px 32px",
            boxShadow:
              "0 40px 90px rgba(15,23,42,0.18), inset 0 3px 3px rgba(255,255,255,0.95), inset 0 -5px 12px rgba(15,23,42,0.12)",
            padding: "clamp(14px, 3vw, 22px)",
          }}
        >
          {/* ------------ machine-lights (decorative strips) ------------ */}
          <div aria-hidden className="machine-lights pointer-events-none absolute inset-0">
            {/* top: green */}
            <div
              className={spinning ? "neon-strip-fast" : "neon-strip"}
              style={{
                position: "absolute",
                top: 9,
                left: 56,
                right: 56,
                height: 4,
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, rgba(99,255,72,0) 0%, #63ff48 25%, #50ef80 75%, rgba(99,255,72,0) 100%)",
                boxShadow: "0 0 12px rgba(99,255,72,0.6)",
              }}
            />
            {/* bottom: cyan/green */}
            <div
              className={spinning ? "neon-strip-fast" : "neon-strip"}
              style={{
                position: "absolute",
                bottom: 9,
                left: 56,
                right: 56,
                height: 4,
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, rgba(50,217,202,0) 0%, #32d9ca 30%, #63ff48 70%, rgba(50,217,202,0) 100%)",
                boxShadow: "0 0 12px rgba(50,217,202,0.55)",
                animationDelay: "1.1s",
              }}
            />
            {/* left: cyan */}
            <div
              className={spinning ? "neon-strip-fast" : "neon-strip"}
              style={{
                position: "absolute",
                top: 120,
                bottom: 120,
                left: 9,
                width: 4,
                borderRadius: 999,
                background:
                  "linear-gradient(180deg, rgba(34,211,238,0) 0%, #22d3ee 30%, #22d3ee 70%, rgba(34,211,238,0) 100%)",
                boxShadow: "0 0 12px rgba(34,211,238,0.55)",
                animationDelay: "0.5s",
              }}
            />
            {/* right: pink */}
            <div
              className={spinning ? "neon-strip-fast" : "neon-strip"}
              style={{
                position: "absolute",
                top: 120,
                bottom: 120,
                right: 9,
                width: 4,
                borderRadius: 999,
                background:
                  "linear-gradient(180deg, rgba(236,72,153,0) 0%, #ec4899 30%, #ec4899 70%, rgba(236,72,153,0) 100%)",
                boxShadow: "0 0 12px rgba(236,72,153,0.55)",
                animationDelay: "0.8s",
              }}
            />
          </div>

          {/* ---------------- machine-top: crown + logo ---------------- */}
          <div
            className="machine-top flex flex-col items-center justify-center gap-1.5 px-4"
            style={{
              background: "linear-gradient(180deg, #191919, #050505)",
              borderRadius: 24,
              border: "2px solid rgba(255,255,255,0.15)",
              minHeight: 100,
              boxShadow: "inset 0 2px 6px rgba(255,255,255,0.08), 0 6px 18px rgba(0,0,0,0.35)",
            }}
          >
            {/* crown icon */}
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden className="crown-glow">
              <path
                d="M2.5 8.2l4.4 3.6L12 4.4l5.1 7.4 4.4-3.6-1.7 9.6H4.2L2.5 8.2z"
                fill="#FFC53D"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="0.8"
              />
              <circle cx="12" cy="15.4" r="1.5" fill="#EC4899" />
            </svg>
            <div
              className="machine-logo font-display leading-none"
              style={{
                fontSize: "clamp(28px, 6vw, 46px)",
                fontWeight: 900,
                letterSpacing: "-2px",
                background: "linear-gradient(90deg, #65FF62 0%, #22D3EE 52%, #EC4899 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 0 12px rgba(34,211,238,0.5))",
              }}
            >
              MEME SLOT
            </div>
          </div>

          {/* ---------------- machine-body ---------------- */}
          <div className="machine-body">
            {/* reel-frame: dark recessed grid */}
            <div
              className="reel-frame"
              style={{
                background: "#101216",
                borderRadius: 28,
                padding: "clamp(10px, 2vw, 16px)",
                marginTop: 14,
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
                boxShadow:
                  "inset 0 10px 25px rgba(0,0,0,0.65), 0 0 0 3px rgba(80,255,110,0.20)",
              }}
            >
              {AXES.map((entries, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden"
                  style={{
                    height: "clamp(140px, 27vw, 205px)",
                    background: "linear-gradient(180deg, #fafafa, #ffffff 45%, #ededeb)",
                    borderRadius: 20,
                    boxShadow: reelShadow,
                    transition: "box-shadow 0.4s ease",
                  }}
                >
                  <ReelWheel
                    entries={entries}
                    targetId={reelTargets ? reelTargets[i] : null}
                    epoch={spinEpoch}
                    stopDelay={STOP_DELAYS[i]}
                    onStopped={() => setStopped((s) => s + 1)}
                  />
                </div>
              ))}
            </div>

            {/* the ONE real SPIN button */}
            <motion.button
              className="machine-spin-button font-display mx-auto mt-5 block disabled:cursor-not-allowed"
              whileHover={!spinning ? { scale: 1.03 } : undefined}
              whileTap={!spinning ? { scale: 0.97 } : undefined}
              onClick={handleSpin}
              disabled={spinning}
              style={{
                width: "min(300px, 80%)",
                height: 68,
                borderRadius: 999,
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: 4,
                color: "#04220a",
                background: spinning
                  ? "linear-gradient(90deg, #3d4a3f, #2a332c)"
                  : "linear-gradient(90deg, #63ff48, #50ef80, #32d9ca)",
                boxShadow: spinning
                  ? "inset 0 3px 6px rgba(0,0,0,0.35)"
                  : "0 12px 32px rgba(80,255,100,0.32), inset 0 3px 5px rgba(255,255,255,0.5)",
                border: "1px solid rgba(20,60,20,0.25)",
                textShadow: spinning ? "none" : "0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              {spinning ? "SPINNING..." : "SPIN"}
            </motion.button>
          </div>

          {/* green/cyan flash when all reels stop */}
          {flash && (
            <div
              className="flash-fade pointer-events-none absolute inset-0"
              style={{
                borderRadius: "50px 50px 32px 32px",
                background:
                  "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.9) 0%, rgba(57,255,20,0.45) 40%, rgba(34,211,238,0.4) 65%, transparent 85%)",
                mixBlendMode: "screen",
              }}
            />
          )}

          {/* AI GENERATION SCREEN */}
          {phase === "creating" && (
            <div className="absolute inset-x-4 bottom-[10%] flex justify-center sm:inset-x-10">
              <div className="w-full max-w-[380px] rounded-3xl bg-black/85 px-5 py-4 text-center shadow-2xl backdrop-blur">
                <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.28em] text-white">
                  AI IS CREATING YOUR MEME
                  <span className="pulse-dot">.</span>
                  <span className="pulse-dot" style={{ animationDelay: "0.2s" }}>.</span>
                  <span className="pulse-dot" style={{ animationDelay: "0.4s" }}>.</span>
                </div>
                <div className="mt-2 text-[10px] font-semibold tracking-[0.2em] text-white/60">
                  {result
                    ? `${result.characterName} + ${result.mutationName} + ${result.styleName}`
                    : ""}
                </div>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-[#39ff14]" />
                  <span className="text-[9px] tracking-[0.25em] text-[#39ff14]/90">
                    {AI_STEPS[aiStep]}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* celebration particles */}
          {celebrate &&
            particles.map((p, i) => (
              <span
                key={i}
                className="particle pointer-events-none absolute bottom-[14%] rounded-full"
                style={{
                  left: `${p.left}%`,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  animationDelay: `${p.delay}s`,
                  boxShadow: `0 0 8px ${p.color}`,
                }}
              />
            ))}
        </div>

        {/* ---------------- machine-lever (right side) ---------------- */}
        <motion.button
          className="machine-lever absolute top-[44%] hidden flex-col items-center md:flex"
          aria-label="Pull the lever to spin"
          onClick={pullLever}
          disabled={spinning}
          style={{ right: -34, cursor: spinning ? "default" : "pointer" }}
          animate={{ y: leverPulled ? 30 : 0, rotate: leverPulled ? 4 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 16 }}
          whileHover={!spinning ? { scale: 1.05 } : undefined}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "radial-gradient(circle at 32% 30%, #b6ffc9, #63ff48 45%, #1f9d3a 100%)",
              boxShadow: "0 0 18px rgba(99,255,72,0.75), 0 4px 10px rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.6)",
            }}
          />
          <div
            style={{
              width: 10,
              height: 86,
              marginTop: -4,
              borderRadius: 6,
              background:
                "linear-gradient(90deg, #6b7280 0%, #e5e7eb 40%, #9ca3af 70%, #4b5563 100%)",
              boxShadow: "2px 4px 8px rgba(0,0,0,0.22)",
            }}
          />
          <div
            style={{
              width: 22,
              height: 14,
              borderRadius: "6px 6px 10px 10px",
              background: "linear-gradient(180deg, #94a3b8, #475569)",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            }}
          />
        </motion.button>

        {/* LEGENDARY / SECRET banner */}
        {celebrate && result && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-[3%] flex justify-center"
          >
            <div
              className="holo-border rounded-full p-[2px]"
              style={{ boxShadow: "0 0 24px rgba(255,197,61,0.8)" }}
            >
              <div className="rounded-full bg-black px-6 py-2 font-display text-sm tracking-[0.25em] text-white">
                {isLegendary ? "LEGENDARY COMBO" : "SECRET COMBO"}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
