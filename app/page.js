import Link from 'next/link';

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="card w-full max-w-lg space-y-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#b8893b]">Namaz Tracker</p>
        <h1 className="text-4xl font-semibold text-[#0f4c45]">Build a consistent prayer habit.</h1>
        <p className="text-[#12302b]/70">Record each salah, review your calendar, and understand your make-up prayer progress in one private place.</p>
        <div className="flex justify-center gap-3"><Link className="btn btn-primary" href="/register">Create account</Link><Link className="btn btn-ghost" href="/login">Log in</Link></div>
      </section>
    </main>
  );
}
