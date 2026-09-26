"use client";

import { create } from "zustand";
import { spin, type SpinResult } from "./spinEngine";
import { useDiscoveryStore } from "./storage";
import { AI_FOR_SPECIAL_COMBOS } from "./ai/config";
import { SPECIAL_COMBOS } from "@/data/combinations";

export type SlotPhase = "idle" | "spinning" | "creating" | "reveal";

export type ReelAxis = "character" | "mutation" | "style";

export type AiStatus = "idle" | "generating" | "done" | "error";

interface SlotState {
  locks: { character: string | null; mutation: string | null; style: string | null };
  forcedCombo: string | null;
  phase: SlotPhase;
  result: SpinResult | null;
  /** reels land on these ids */
  reelTargets: [string, string, string] | null;
  spinSeed: number;
  spinEpoch: number;
  toast: string | null;

  /* AI generation state (one request per active spin) */
  aiStatus: AiStatus;
  aiImageUrl: string | null;
  generationId: string | null;
  aiFallback: boolean;
  aiError: string | null;
  aiAttempted: boolean;
  savedThisSpin: boolean;

  toggleLock: (axis: ReelAxis, id: string) => void;
  setLocks: (locks: Partial<SlotState["locks"]>) => void;
  setForcedCombo: (id: string | null) => void;
  clearLocks: () => void;
  showToast: (msg: string) => void;
  startSpin: () => void;
  setPhase: (p: SlotPhase) => void;
  requestAi: () => void;
  retryAi: () => void;
  saveToCollection: () => void;
  closeResult: () => void;
}

function makeSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
}

export const useSlotStore = create<SlotState>((set, get) => ({
  locks: { character: null, mutation: null, style: null },
  forcedCombo: null,
  phase: "idle",
  result: null,
  reelTargets: null,
  spinSeed: 0,
  spinEpoch: 0,
  toast: null,

  aiStatus: "idle",
  aiImageUrl: null,
  generationId: null,
  aiFallback: false,
  aiError: null,
  aiAttempted: false,
  savedThisSpin: false,

  toggleLock: (axis, id) => {
    const locks = get().locks;
    const next = locks[axis] === id ? null : id;
    set({ locks: { ...locks, [axis]: next } });
    const label =
      axis === "character"
        ? next
          ? `${id.toUpperCase()} LOCKED`
          : `${id.toUpperCase()} UNLOCKED`
        : next
          ? `${id.toUpperCase().replace(/-/g, " ")} LOCKED`
          : `${id.toUpperCase().replace(/-/g, " ")} UNLOCKED`;
    get().showToast(label);
  },

  setForcedCombo: (id) => set({ forcedCombo: id }),

  /** used by the RANDOM button — replaces the whole lock set at once */
  setLocks: (partial) =>
    set((state) => ({ locks: { ...state.locks, ...partial } })),

  clearLocks: () => set({ locks: { character: null, mutation: null, style: null } }),

  showToast: (msg) => {
    set({ toast: msg });
    window.setTimeout(() => {
      if (get().toast === msg) set({ toast: null });
    }, 1800);
  },

  startSpin: () => {
    const { locks, forcedCombo, phase } = get();
    if (phase === "spinning" || phase === "creating") return;

    // ?force=NN support (production-safe test hook)
    let force = forcedCombo;
    if (!force && typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("force");
      if (q && SPECIAL_COMBOS.some((c) => c.id === q)) force = q;
    }

    const seed = makeSeed();
    const result = spin(
      {
        lockedCharacter: locks.character,
        lockedMutation: locks.mutation,
        lockedStyle: locks.style,
        forcedCombo: force,
      },
      seed
    );

    set({
      result,
      reelTargets: [result.characterId, result.mutationId, result.styleId],
      spinSeed: seed,
      spinEpoch: get().spinEpoch + 1,
      phase: "spinning",
      // reset per-spin AI state
      aiStatus: "idle",
      aiImageUrl: null,
      generationId: null,
      aiFallback: false,
      aiError: null,
      aiAttempted: false,
      savedThisSpin: false,
    });
  },

  setPhase: (p) => set({ phase: p }),

  /**
   * Call the server AI route ONCE per spin, after the reels have locked.
   * Special combos keep their curated images unless AI_FOR_SPECIAL_COMBOS.
   */
  requestAi: () => {
    const { result, aiAttempted, phase } = get();
    if (!result || aiAttempted) return;
    if (result.specialCombo && !AI_FOR_SPECIAL_COMBOS) return;
    if (phase !== "creating") return;

    set({ aiAttempted: true, aiStatus: "generating", aiError: null });

    fetch("/api/generate-meme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character: result.characterId,
        mutation: result.mutationId,
        style: result.styleId,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (res.ok && data?.success && typeof data.imageUrl === "string") {
          set({
            aiStatus: "done",
            aiImageUrl: data.imageUrl,
            generationId: data.generationId,
            aiFallback: data.fallback === true,
          });
        } else {
          set({
            aiStatus: "error",
            aiError:
              (data && typeof data.message === "string" && data.message) ||
              "AI generation failed.",
          });
        }
      })
      .catch(() => {
        set({
          aiStatus: "error",
          aiError: "Could not reach the AI service. Check your connection.",
        });
      });
  },

  retryAi: () => {
    const { result, phase } = get();
    if (!result || phase !== "reveal") return;
    set({ aiAttempted: false, aiError: null, phase: "creating" });
    // allow the creating phase to render before firing the request
    window.setTimeout(() => get().requestAi(), 50);
  },

  /** Explicit save (SAVE TO COLLECTION button) — one save per spin result. */
  saveToCollection: () => {
    const { result, aiImageUrl, savedThisSpin } = get();
    if (!result || savedThisSpin) return;
    const ai = aiImageUrl !== null;
    useDiscoveryStore.getState().addDiscovery({
      id: ai
        ? `${result.characterId}-${result.mutationId}-${result.styleId}-${Date.now()}`
        : `${result.characterId}-${result.mutationId}-${result.styleId}`,
      character: result.characterId,
      mutation: result.mutationId,
      style: result.styleId,
      resultName: result.name,
      rarity: result.rarity,
      image: aiImageUrl ?? result.image,
      specialCombo: result.specialCombo,
      aiGenerated: ai,
      timestamp: Date.now(),
    });
    set({ savedThisSpin: true });
    get().showToast("SAVED TO COLLECTION");
  },

  closeResult: () => set({ phase: "idle" }),
}));
