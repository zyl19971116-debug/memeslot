import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="font-display text-7xl tracking-tight text-black/10">404</div>
      <h1 className="mt-2 font-display text-2xl tracking-tight">THIS REEL DOES NOT EXIST</h1>
      <p className="mt-3 text-sm text-black/50">
        The page you are looking for rolled off the machine.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-black px-8 py-3 font-display text-xs tracking-[0.2em] text-white"
        style={{ boxShadow: "0 0 18px rgba(57,255,20,0.4)" }}
      >
        BACK TO THE MACHINE
      </Link>
    </div>
  );
}
