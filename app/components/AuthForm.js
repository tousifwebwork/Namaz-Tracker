'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  MoonStar,
  ShieldCheck,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

/* ---------- Illustrations (original inline SVG, no external assets) ---------- */

const Dove = ({ className = '', style }) => (
  <svg viewBox="0 0 48 32" aria-hidden className={className} style={style} fill="currentColor">
    <path d="M2 18C10 16 16 12 22 4c2 6 4 10 8 12 6-6 12-8 16-6-4 4-8 10-16 12-4 6-12 8-20 6 4-2 6-4 8-6-6 0-12-1-16-4Z" />
  </svg>
);

const Stars = ({ count = 14 }) => {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: (i * 53 + 11) % 100,
        top: (i * 37 + 7) % 62,
        size: 1.5 + ((i * 7) % 3),
        delay: (i % 6) * 0.5,
      })),
    [count]
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute animate-pulse rounded-full bg-white/80"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: '3s',
          }}
        />
      ))}
    </div>
  );
};

const Skyline = ({ className = '' }) => (
  <svg
    viewBox="0 0 800 160"
    preserveAspectRatio="xMidYMax slice"
    aria-hidden
    className={className}
  >
    {/* far layer */}
    <g fill="#0f5c52" opacity="0.35">
      <rect x="20" y="110" width="60" height="50" />
      <path d="M20 110a30 30 0 0 1 60 0Z" />
      <rect x="610" y="100" width="70" height="60" />
      <path d="M610 100a35 35 0 0 1 70 0Z" />
    </g>
    {/* main mosque */}
    <g fill="#0f5c52" opacity="0.9">
      <rect x="82" y="40" width="16" height="120" />
      <polygon points="80,40 100,40 90,10" />
      <rect x="702" y="50" width="16" height="110" />
      <polygon points="700,50 720,50 710,20" />
      <rect x="300" y="100" width="200" height="60" />
      <path d="M320 100a80 80 0 0 1 160 0Z" />
      <rect x="400" y="2" width="1.6" height="18" />
      <rect x="260" y="120" width="80" height="40" />
      <path d="M260 120a40 40 0 0 1 80 0Z" />
      <rect x="460" y="120" width="80" height="40" />
      <path d="M460 120a40 40 0 0 1 80 0Z" />
    </g>
    {/* lit windows */}
    <g fill="#e0b85a" opacity="0.85">
      <rect x="387" y="116" width="26" height="44" rx="13" />
      <rect x="86" y="70" width="4" height="12" rx="2" />
      <rect x="706" y="80" width="4" height="12" rx="2" />
    </g>
    {/* camel */}
    <g transform="translate(560 90) scale(0.8)" fill="#0a3d36">
      <ellipse cx="30" cy="38" rx="28" ry="12" />
      <circle cx="22" cy="25" r="8" />
      <circle cx="40" cy="26" r="7" />
      <path d="M52 34Q64 30 62 14l8-2q4 16-10 32Z" />
      <ellipse cx="75" cy="12" rx="9" ry="5" transform="rotate(-10 75 12)" />
      <g stroke="#0a3d36" strokeWidth="4" strokeLinecap="round">
        <line x1="10" y1="44" x2="9" y2="66" />
        <line x1="20" y1="46" x2="21" y2="66" />
        <line x1="42" y1="46" x2="41" y2="66" />
        <line x1="52" y1="44" x2="53" y2="66" />
      </g>
    </g>
    {/* ground */}
    <rect x="0" y="144" width="800" height="16" fill="#0a3d36" />
  </svg>
);

const Moon = ({ className = '' }) => (
  <div aria-hidden className={className}>
    <div className="absolute inset-0 rounded-full bg-[#e0b85a]/25 blur-2xl" />
    <svg viewBox="0 0 100 100" className="relative h-full w-full">
      <path
        d="M62 8a42 42 0 1 0 30 70A34 34 0 0 1 62 8Z"
        fill="#f3d98b"
      />
    </svg>
  </div>
);

const Brand = ({ light }) => (
  <div
    className={`flex items-center gap-2.5 font-serif text-lg font-semibold sm:text-xl ${
      light ? 'text-white' : 'text-[#0c2421]'
    }`}
  >
    <span
      className={`grid h-10 w-10 place-items-center rounded-xl ${
        light ? 'bg-white/10 ring-1 ring-white/15 backdrop-blur' : 'bg-[#0f5c52]'
      } text-[#e0b85a]`}
    >
      <MoonStar size={20} />
    </span>
    Namaz Tracker
  </div>
);

/* ---------- Password strength ---------- */

const strengthOf = (pw) => {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const STRENGTH_LABEL = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['bg-black/10', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-600'];

/* ---------- Main component ---------- */

export default function AuthForm({ mode }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const reg = mode === 'register';
  const score = strengthOf(password);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/auth/${mode}`, 'POST', { username: username.trim(), password });
      router.replace('/record');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const float = (dx, dy, dur, delay = 0) =>
    reduce
      ? {}
      : {
          animate: { x: [0, dx, 0], y: [0, dy, 0] },
          transition: { duration: dur, delay, repeat: Infinity, ease: 'easeInOut' },
        };

  const inputBase =
    'h-12 w-full rounded-xl bg-white text-base font-normal text-[#0c2421] ring-1 ring-black/10 transition placeholder:text-black/35 hover:ring-black/20 focus:outline-none focus:ring-2 focus:ring-[#0f5c52] sm:h-[52px]';

  return (
    <main className="min-h-[100dvh] bg-[#f3f6f5] lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ===== Brand panel (desktop) ===== */}
      <section className="relative hidden overflow-hidden bg-[#0c2421] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(55% 45% at 85% 8%, rgba(224,184,90,.28), transparent), radial-gradient(40% 40% at 0% 100%, rgba(15,92,82,.55), transparent), linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
            backgroundSize: 'auto, auto, 40px 40px, 40px 40px',
          }}
        />
        <Stars count={22} />
        <Moon className="absolute right-12 top-14 h-24 w-24 xl:right-20 xl:h-28 xl:w-28" />

        <motion.div {...float(30, -10, 9)} className="absolute right-[28%] top-[22%] text-white/70">
          <Dove className="h-7 w-10" />
        </motion.div>
        <motion.div {...float(-24, 8, 11, 1)} className="absolute right-[18%] top-[32%] text-white/45">
          <Dove className="h-5 w-7" />
        </motion.div>
        <motion.div {...float(20, 12, 13, 2)} className="absolute right-[40%] top-[14%] text-white/35">
          <Dove className="h-4 w-6" />
        </motion.div>

        <div className="relative">
          <Brand light />
        </div>

        <div className="relative pb-40 xl:pb-48">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-5xl font-semibold leading-[1.08] xl:text-6xl"
          >
            Every prayer,
            <br />
            accounted for.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="mt-5 max-w-md text-base leading-relaxed text-white/70"
          >
            Log each salah, see your month and year at a glance, and know exactly how much is left to make up.
          </motion.p>

          <div className="mt-10 flex gap-5 xl:gap-6">
            {PRAYERS.map((p, i) => (
              <div key={p} className="flex flex-col items-center gap-2.5">
                <motion.span
                  initial={{ backgroundColor: 'rgba(224,184,90,0)' }}
                  animate={{ backgroundColor: '#e0b85a' }}
                  transition={{ delay: 0.7 + i * 0.35, duration: 0.4 }}
                  className="grid h-12 w-12 place-items-center rounded-full border border-white/25 text-[#0c2421] xl:h-14 xl:w-14"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.35, type: 'spring', stiffness: 380, damping: 18 }}
                  >
                    <Check size={22} strokeWidth={3} />
                  </motion.span>
                </motion.span>
                <span className="text-xs font-medium text-white/65">{p}</span>
              </div>
            ))}
          </div>
        </div>

        <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full xl:h-48" />
        <p className="relative z-10 flex items-center gap-2 text-sm text-white/60">
          <ShieldCheck size={16} /> Private by design. Your records belong only to you.
        </p>
      </section>

      {/* ===== Form panel ===== */}
      <section className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-[#0c2421] lg:min-h-0 lg:overflow-visible lg:bg-transparent">
        {/* Mobile / tablet background: covers the hero AND the form card */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 lg:hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(70% 40% at 90% 0%, rgba(224,184,90,.30), transparent), radial-gradient(70% 40% at 0% 100%, rgba(15,92,82,.6), transparent)',
            }}
          />
          <Stars count={22} />
          <Moon className="absolute right-5 top-6 h-14 w-14 sm:right-10 sm:h-20 sm:w-20" />
          <motion.div {...float(14, -6, 8)} className="absolute right-[34%] top-12 text-white/60 sm:top-14">
            <Dove className="h-5 w-7 sm:h-6 sm:w-9" />
          </motion.div>
          <motion.div {...float(-10, 6, 10, 1)} className="absolute right-[22%] top-20 text-white/35 sm:top-24">
            <Dove className="h-4 w-6" />
          </motion.div>
          <Skyline className="absolute inset-x-0 bottom-0 h-20 w-full sm:h-28" />
        </div>

        {/* Mobile / tablet hero content */}
        <div className="relative px-5 pb-2 pt-[max(1.5rem,env(safe-area-inset-top))] text-white sm:px-8 lg:hidden">
          <div className="relative mx-auto max-w-md">
            <Brand light />
            <p className="mt-5 max-w-[16rem] font-serif text-2xl font-semibold leading-tight sm:max-w-xs sm:text-3xl">
              Every prayer, accounted for.
            </p>
            <div className="mt-5 flex items-center gap-2.5" aria-hidden>
              {PRAYERS.map((p, i) => (
                <motion.span
                  key={p}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 300, damping: 18 }}
                  className="grid h-7 w-7 place-items-center rounded-full bg-[#e0b85a] text-[#0c2421]"
                >
                  <Check size={14} strokeWidth={3} />
                </motion.span>
              ))}
            </div>
          </div>
        </div>

        {/* Form card: sits inside the hero background on mobile */}
        <div className="relative z-10 mt-5 flex flex-1 items-start justify-center px-4 pb-[max(7rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-36 lg:mt-0 lg:items-center lg:px-12 lg:pb-0">
          <motion.form
            onSubmit={submit}
            noValidate={false}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full max-w-md space-y-5 rounded-3xl bg-white p-5 shadow-[0_20px_50px_-20px_rgba(12,36,33,.3)] ring-1 ring-black/5 sm:space-y-6 sm:p-8 lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-0"
          >
            <div>
              <h1 className="font-serif text-[1.75rem] font-semibold leading-tight text-[#0c2421] sm:text-4xl">
                {reg ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#0c2421]/60 sm:text-base">
                {reg
                  ? 'Pick a username and password. Your records stay private.'
                  : 'Log in to continue your record.'}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-red-200"
              >
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-[#0c2421]">
                Username
                <div className="relative mt-2">
                  <User
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0c2421]/40"
                  />
                  <input
                    className={`${inputBase} pl-11 pr-4`}
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setU(e.target.value)}
                    required
                    minLength={3}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                  />
                </div>
              </label>

              <label className="block text-sm font-semibold text-[#0c2421]">
                Password
                <div className="relative mt-2">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0c2421]/40"
                  />
                  <input
                    className={`${inputBase} pl-11 pr-14`}
                    type={show ? 'text' : 'password'}
                    placeholder="Password (min 6 characters)"
                    value={password}
                    onChange={(e) => setP(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={reg ? 'new-password' : 'current-password'}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="go"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    aria-pressed={show}
                    className="absolute right-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-[#0c2421]/50 transition hover:bg-black/5 hover:text-[#0c2421] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b85a]"
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {reg && password.length > 0 && (
                  <div className="mt-3" aria-live="polite">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((n) => (
                        <span
                          key={n}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            score >= n ? STRENGTH_COLOR[score] : 'bg-black/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-[#0c2421]/55">
                      Strength: {STRENGTH_LABEL[score]}
                    </p>
                  </div>
                )}
              </label>
            </div>

            <motion.button
              whileHover={reduce ? undefined : { y: -1 }}
              whileTap={{ scale: 0.98 }}
              disabled={busy}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f5c52] text-base font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,92,82,.7)] transition hover:bg-[#0b4a42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b85a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:h-[52px]"
            >
              {busy && <Loader2 size={18} className="animate-spin" />}
              {busy ? 'Please wait…' : reg ? 'Create account' : 'Log in'}
              {!busy && (
                <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
              )}
            </motion.button>

            <p className="text-center text-sm text-[#0c2421]/60 sm:text-[15px]">
              {reg ? (
                <>
                  Already registered?{' '}
                  <Link
                    className="inline-block py-2 font-semibold text-[#0f5c52] underline-offset-4 hover:underline"
                    href="/login"
                  >
                    Log in
                  </Link>
                </>
              ) : (
                <>
                  New here?{' '}
                  <Link
                    className="inline-block py-2 font-semibold text-[#0f5c52] underline-offset-4 hover:underline"
                    href="/register"
                  >
                    Create an account
                  </Link>
                </>
              )}
            </p>

            <p className="flex items-center justify-center gap-1.5 text-xs text-[#0c2421]/45 lg:hidden">
              <ShieldCheck size={14} /> Private by design. Your records belong only to you.
            </p>
          </motion.form>
        </div>
      </section>
    </main>
  );
}