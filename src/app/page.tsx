"use client";

import InteractiveSlotMachine from "@/components/meme-slot/InteractiveSlotMachine";
import MemeBuilder from "@/components/meme-slot/MemeBuilder";
import ResultReveal from "@/components/ResultReveal";
import Toast from "@/components/Toast";

const HOW_IT_WORKS = [
  { n: "01", title: "Pick a Character", desc: "Lock your legend or let fate decide." },
  { n: "02", title: "Get a Mutation", desc: "Laser eyes, gold skin, zombie vibes." },
  { n: "03", title: "Enter a World", desc: "Cyber, space, cute or degen." },
  { n: "04", title: "Discover Your Meme", desc: "Every spin creates a new combination." },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* ------------------------------- HERO ------------------------------- */}
      <section className="grid grid-cols-1 items-center gap-10 py-10 lg:grid-cols-[0.75fr_1.6fr_0.65fr] lg:gap-6 lg:py-14">
        {/* left: title */}
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <h1 className="font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">
            SPIN.
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #39ff14, #2e9bff)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              MIX.
            </span>
            <br />
            CREATE.
          </h1>
          <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-black/60 lg:mx-0 lg:text-base">
            Three reels. Infinite meme combinations.
            <br />
            Spin the machine and discover your next meme.
          </p>
          <p
            className="mt-4 text-2xl text-black/45"
            style={{ fontFamily: "var(--font-hand), cursive" }}
          >
            same memes. new possibilities.
          </p>
        </div>

        {/* center: the big machine */}
        <div className="order-1 lg:order-2 lg:px-2">
          <InteractiveSlotMachine />
        </div>

        {/* right: how it works */}
        <div className="order-3 mx-auto w-full max-w-xs lg:mx-0 lg:ml-auto">
          <h3 className="font-display text-sm tracking-[0.3em] text-black/50">
            HOW IT WORKS
          </h3>
          <ol className="mt-5 space-y-4">
            {HOW_IT_WORKS.map((step) => (
              <li key={step.n} className="flex items-start gap-4">
                <span
                  className="flex h-8 w-9 shrink-0 items-center justify-center rounded-full font-display text-[10px] text-[#04220a]"
                  style={{
                    background: "linear-gradient(135deg, #64FF45, #22D3EE)",
                    boxShadow: "0 0 12px rgba(100,255,69,0.4)",
                  }}
                >
                  {step.n}
                </span>
                <div>
                  <div className="text-sm font-bold tracking-wide">{step.title}</div>
                  <div className="text-xs text-black/45">{step.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------- BUILDER ------------------------------- */}
      <MemeBuilder />

      <ResultReveal />
      <Toast />
    </div>
  );
}
