"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import CreationCard from "@/components/CreationCard";
import { CREATIONS } from "@/data/creations";

const TABS = ["NEW", "POPULAR", "RARE", "LEGENDARY"] as const;
type Tab = (typeof TABS)[number];

function CreationsGrid() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").toLowerCase();
  const [tab, setTab] = useState<Tab>("NEW");

  const list = useMemo(() => {
    let out = [...CREATIONS];
    if (tab === "NEW") out.sort((a, b) => a.daysAgo - b.daysAgo);
    if (tab === "POPULAR") out.sort((a, b) => b.likes - a.likes);
    if (tab === "RARE")
      out = out.filter((c) => c.rarity === "RARE" || c.rarity === "EPIC");
    if (tab === "LEGENDARY") out = out.filter((c) => c.rarity === "LEGENDARY");
    if (q) out = out.filter((c) => c.name.toLowerCase().includes(q) || c.combo.toLowerCase().includes(q));
    return out;
  }, [tab, q]);

  return (
    <>
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-5 py-2 text-xs font-bold tracking-[0.2em] transition-colors ${
              tab === t ? "bg-black text-white" : "bg-white text-black/55 hover:bg-black/5"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-black/15 py-20 text-center text-sm text-black/40">
          NOTHING HERE YET. GO SPIN THE MACHINE.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((c) => (
            <CreationCard key={c.id} creation={c} />
          ))}
        </div>
      )}
    </>
  );
}

export default function CreationsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl tracking-tight sm:text-4xl">CREATIONS</h1>
      <p className="mb-8 mt-2 text-sm text-black/50">
        Community gallery — fresh combos from the machine.
      </p>
      <Suspense fallback={<div className="py-20 text-center text-sm text-black/40">LOADING...</div>}>
        <CreationsGrid />
      </Suspense>
    </div>
  );
}
