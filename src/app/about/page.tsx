import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
        EVERY SPIN
        <br />
        CREATES
        <span
          className="ml-3"
          style={{
            background: "linear-gradient(90deg, #39ff14, #2e9bff, #ff2d8a)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          A NEW MEME.
        </span>
      </h1>

      <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-black/60">
        MEME SLOT combines characters, mutations and worlds into unexpected meme
        creations.
      </p>
      <p className="mt-3 text-sm text-black/45">
        Three reels. Thousands of possibilities.
      </p>

      {/* marketing visuals */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/meme-slot/marketing/astronaut-doge.png"
            alt="Astronaut Doge"
            className="aspect-square w-full object-cover"
          />
        </div>
        <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/meme-slot/marketing/meme-group.png"
            alt="The meme crew"
            className="aspect-square w-full object-cover"
          />
        </div>
      </div>

      <p
        className="mt-12 text-3xl text-black/60"
        style={{ fontFamily: "var(--font-hand), cursive" }}
      >
        spin. mix. create.
      </p>

      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-black px-10 py-4 font-display text-sm tracking-[0.2em] text-white transition-transform hover:scale-105"
        style={{ boxShadow: "0 0 20px rgba(57,255,20,0.4)" }}
      >
        START SPINNING
      </Link>
    </div>
  );
}
