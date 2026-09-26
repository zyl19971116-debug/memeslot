"use client";

import { CHARACTERS } from "@/data/characters";
import { MUTATIONS } from "@/data/mutations";
import { STYLES } from "@/data/styles";
import { useSlotStore } from "@/lib/slotStore";
import SelectorRow from "./SelectorRow";
import CharacterCard from "./CharacterCard";
import MutationCard from "./MutationCard";
import WorldCard from "./WorldCard";

/**
 * BUILD YOUR MEME — the one and only builder on the page.
 * Replaces the old POPULAR CHARACTERS / TRY A MUTATION / CHOOSE A WORLD sections.
 * Uses the exact same lock store: locked selections stay fixed, the rest randomize.
 */
export default function MemeBuilder() {
  const { locks, toggleLock, clearLocks, setLocks, showToast } = useSlotStore();

  const randomizeAll = () => {
    const rc = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    const rm = MUTATIONS[Math.floor(Math.random() * MUTATIONS.length)];
    const rs = STYLES[Math.floor(Math.random() * STYLES.length)];

    clearLocks();
    showToast("FULL RANDOM SELECTED");
    // quick staggered selection animation
    window.setTimeout(() => setLocks({ character: rc.id }), 60);
    window.setTimeout(() => setLocks({ mutation: rm.id }), 180);
    window.setTimeout(() => setLocks({ style: rs.id }), 300);
  };

  return (
    <section className="mt-16 pb-20">
      {/* section header */}
      <div className="mb-6 flex flex-col items-center gap-1 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
        <div className="w-full sm:w-auto">
          <h2 className="font-display text-3xl tracking-tight text-[#17181c] sm:text-4xl">
            BUILD YOUR{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #39ff14 0%, #22D3EE 55%, #3B82F6 110%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              MEME
            </span>
          </h2>
          <p className="mt-1.5 text-xs text-black/50 sm:text-sm">
            Choose one from each category — or let the slot decide.
          </p>
        </div>
        <button
          onClick={randomizeAll}
          className="flex shrink-0 items-center gap-2 self-center rounded-full bg-white px-5 py-2.5 text-[10px] font-black tracking-[0.22em] text-black transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={{ border: "1px solid #E8E8E8", boxShadow: "0 2px 10px rgba(15,23,42,0.06)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" />
            <circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" />
            <circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" />
            <circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" />
          </svg>
          RANDOM
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <SelectorRow
          index="01"
          title="CHARACTER"
          description="Choose your legend. Each character has a different soul."
          accent="green"
        >
          {CHARACTERS.map((c) => (
            <CharacterCard
              key={c.id}
              character={c}
              selected={locks.character === c.id}
              onSelect={() => toggleLock("character", c.id)}
            />
          ))}
        </SelectorRow>

        <SelectorRow
          index="02"
          title="MUTATION"
          description="Give it a twist. Mutations create new personalities."
          accent="purple"
        >
          {MUTATIONS.map((m) => (
            <MutationCard
              key={m.id}
              mutation={m}
              selected={locks.mutation === m.id}
              onSelect={() => toggleLock("mutation", m.id)}
            />
          ))}
        </SelectorRow>

        <SelectorRow
          index="03"
          title="WORLD"
          description="Enter a new universe. Different worlds create different vibes."
          accent="cyan"
        >
          {STYLES.map((s) => (
            <WorldCard
              key={s.id}
              style={s}
              selected={locks.style === s.id}
              onSelect={() => toggleLock("style", s.id)}
            />
          ))}
        </SelectorRow>
      </div>
    </section>
  );
}
