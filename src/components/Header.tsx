"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import WalletButton from "./wallet/WalletButton";

const NAV = [
  { href: "/", label: "SLOT" },
  { href: "/creations", label: "CREATIONS" },
  { href: "/collection", label: "COLLECTION" },
  { href: "/about", label: "ABOUT" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="select-none">
          <span
            className="font-display text-lg tracking-tight"
            style={{
              background: "linear-gradient(90deg, #39ff14, #2e9bff, #ff2d8a)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 0 10px rgba(57,255,20,0.35))",
            }}
          >
            MEME SLOT
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.15em] transition-colors ${
                  active ? "bg-black text-white" : "text-black/60 hover:bg-black/5 hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <input
            type="text"
            placeholder="Search memes"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const q = (e.target as HTMLInputElement).value.trim();
                router.push(q ? `/creations?q=${encodeURIComponent(q)}` : "/creations");
              }
            }}
            className="hidden w-40 rounded-full border border-black/10 bg-white px-4 py-2 text-xs text-black outline-none transition-all placeholder:text-black/30 focus:w-52 focus:border-black/30 xl:block"
          />
          <Link
            href="/#machine"
            className="hidden rounded-full bg-black px-5 py-2 text-xs font-bold tracking-[0.15em] text-white transition-transform hover:scale-105 lg:block"
            style={{ boxShadow: "0 0 16px rgba(57,255,20,0.35)" }}
          >
            CREATE
          </Link>
          <WalletButton />
        </div>
      </div>

      {/* mobile nav */}
      <nav className="flex items-center justify-center gap-2 border-t border-black/5 px-4 py-2 md:hidden">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] ${
                active ? "bg-black text-white" : "text-black/60"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
