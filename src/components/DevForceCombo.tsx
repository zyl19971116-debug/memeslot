"use client";

import { useEffect, useState } from "react";
import { SPECIAL_COMBOS } from "@/data/combinations";
import { CHARACTERS } from "@/data/characters";
import { MUTATIONS } from "@/data/mutations";
import { STYLES } from "@/data/styles";
import { useSlotStore } from "@/lib/slotStore";

/**
 * Development test control:
 *  1. Force one of the 10 special combos (reel forcing).
 *  2. Fire a real AI generation through the production API route.
 * Hidden by default — expand via the tiny DEV chip. Also available via ?devai=1.
 */

const AI_PRESETS: Array<[string, string, string]> = [
  ["pepe", "king", "cyber"],
  ["doge", "zombie", "dark"],
  ["pengu", "ice", "future"],
  ["unicorn", "radioactive", "future"],
];

export default function DevForceCombo() {
  const [open, setOpen] = useState(false);
  const { forcedCombo, setForcedCombo, showToast } = useSlotStore();

  /* AI test panel state */
  const [devAi, setDevAi] = useState(false);
  const [c, setC] = useState("pepe");
  const [m, setM] = useState("king");
  const [s, setS] = useState("cyber");
  const [testing, setTesting] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiMsg, setAiMsg] = useState<string | null>(null);

  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" ||
      new URLSearchParams(window.location.search).get("devai") === "1"
    ) {
      setDevAi(true);
    }
  }, []);

  const runAiTest = async () => {
    setTesting(true);
    setAiResult(null);
    setAiMsg("GENERATING...");
    try {
      const res = await fetch("/api/generate-meme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: c, mutation: m, style: s }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setAiResult(data.imageUrl);
        setAiMsg(`OK — ${data.resultName}`);
      } else {
        setAiMsg(`FAILED (${data?.code ?? res.status}): ${data?.message ?? "unknown"}`);
      }
    } catch (err) {
      setAiMsg(`REQUEST ERROR: ${String(err)}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[9px] tracking-[0.3em] text-black/25 transition-colors hover:text-black/50"
      >
        {open ? "DEV ▲" : "DEV ▼"}
      </button>

      {open && (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white/70 p-4">
          <div className="mb-2 text-center text-[10px] font-bold tracking-[0.25em] text-black/50">
            FORCE SPECIAL COMBO (DEV)
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {SPECIAL_COMBOS.map((combo) => (
              <button
                key={combo.id}
                onClick={() => {
                  setForcedCombo(forcedCombo === combo.id ? null : combo.id);
                  showToast(
                    forcedCombo === combo.id
                      ? "FORCE CLEARED"
                      : `FORCE ${combo.id}: ${combo.resultName}`
                  );
                }}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wider transition-colors ${
                  forcedCombo === combo.id
                    ? "border-transparent bg-black text-white"
                    : "border-black/15 text-black/60 hover:bg-black/5"
                }`}
              >
                {combo.id}
              </button>
            ))}
            {forcedCombo && (
              <span className="self-center text-[10px] font-semibold text-black/50">
                → {SPECIAL_COMBOS.find((x) => x.id === forcedCombo)?.resultName}
              </span>
            )}
          </div>

          {/* --------------------- AI GENERATION TEST --------------------- */}
          {devAi && (
            <div className="mt-4 border-t border-dashed border-black/15 pt-4">
              <div className="mb-2 text-center text-[10px] font-bold tracking-[0.25em] text-black/50">
                TEST AI GENERATION (DEV)
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <select
                  value={c}
                  onChange={(e) => setC(e.target.value)}
                  className="rounded-lg border border-black/15 bg-white px-2 py-1 text-[10px] font-bold"
                >
                  {CHARACTERS.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
                <select
                  value={m}
                  onChange={(e) => setM(e.target.value)}
                  className="rounded-lg border border-black/15 bg-white px-2 py-1 text-[10px] font-bold"
                >
                  {MUTATIONS.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
                <select
                  value={s}
                  onChange={(e) => setS(e.target.value)}
                  className="rounded-lg border border-black/15 bg-white px-2 py-1 text-[10px] font-bold"
                >
                  {STYLES.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={runAiTest}
                  disabled={testing}
                  className="rounded-full bg-black px-3 py-1.5 text-[10px] font-bold tracking-wider text-white disabled:opacity-50"
                >
                  {testing ? "GENERATING..." : "GENERATE TEST MEME"}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {AI_PRESETS.map(([pc, pm, ps]) => (
                  <button
                    key={`${pc}-${pm}-${ps}`}
                    onClick={() => {
                      setC(pc);
                      setM(pm);
                      setS(ps);
                    }}
                    className="rounded-full border border-black/10 px-2 py-1 text-[9px] tracking-wider text-black/50 hover:bg-black/5"
                  >
                    {pc}+{pm}+{ps}
                  </button>
                ))}
              </div>
              {aiMsg && (
                <div className="mt-2 text-center text-[10px] font-semibold text-black/60">
                  {aiMsg}
                </div>
              )}
              {aiResult && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={aiResult}
                  alt="AI test result"
                  className="mx-auto mt-2 w-48 rounded-2xl shadow-lg"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
