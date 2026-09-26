import type { Rarity } from "@/data/base";

const RARITY_STYLES: Record<Rarity, { bg: string; text: string; shadow: string }> = {
  COMMON: { bg: "#f1f1f1", text: "#555555", shadow: "none" },
  RARE: { bg: "#e3f0ff", text: "#1d6fd1", shadow: "0 0 14px rgba(46,155,255,0.45)" },
  EPIC: { bg: "#efe3ff", text: "#7a2bd1", shadow: "0 0 14px rgba(140,60,255,0.45)" },
  LEGENDARY: { bg: "#fff3d1", text: "#a06a00", shadow: "0 0 16px rgba(255,197,61,0.55)" },
  SECRET: { bg: "#111111", text: "#ffffff", shadow: "0 0 18px rgba(255,45,138,0.6)" },
};

export default function RarityBadge({
  rarity,
  className = "",
}: {
  rarity: Rarity;
  className?: string;
}) {
  const s = RARITY_STYLES[rarity];
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.2em] ${className}`}
      style={{ backgroundColor: s.bg, color: s.text, boxShadow: s.shadow }}
    >
      {rarity === "SECRET" ? (
        <span className="holo-text font-display">{rarity}</span>
      ) : (
        rarity
      )}
    </span>
  );
}
