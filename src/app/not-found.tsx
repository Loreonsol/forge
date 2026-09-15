import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-5 py-24 text-center">
      <p className="font-mono text-xs font-medium uppercase tracking-widest text-ember">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-snow">
        Page not found
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-mist">
        That route doesn&apos;t exist — or the run may still be writing to disk.
        Head home or jump into a recent forge.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-gradient-to-r from-ember to-forge px-5 py-2.5 text-sm font-semibold text-ink shadow-glow transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
        >
          Back home
        </Link>
        <Link
          href="/#recent"
          className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-snow transition hover:border-white/25 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
        >
          View recent runs
        </Link>
      </div>
    </div>
  );
}
