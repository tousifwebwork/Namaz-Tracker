'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CalendarDays, ClipboardCheck, Loader2, LogOut, MoonStar, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

const links = [
  ['/record', 'Namaz Record', 'Record', ClipboardCheck],
  ['/calendar', 'Islamic Calendar', 'Calendar', CalendarDays],
  ['/profile', 'Profile', 'Profile', UserRound],
];

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b85a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c2421]';
const spring = { type: 'spring', stiffness: 420, damping: 34 };

export default function Navbar({ username }) {
  const path = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await api('/api/auth/logout', 'POST');
      router.replace('/login');
    } catch (e) {
      toast.error(e.message || 'Could not log out');
      setBusy(false);
    }
  };

  const active = (h) => path === h || path?.startsWith(`${h}/`);
  const initial = username?.[0]?.toUpperCase();

  return (
    <>
      {/* Skip link (add id="main" to your <main> element) */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-70 focus:rounded-lg focus:bg-[#e0b85a] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#0c2421]"
      >
        Skip to content
      </a>

      {/* ── Top bar ── */}
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 border-b border-white/10 bg-[#0c2421]/90 text-white backdrop-blur-xl"
        style={{
          backgroundImage:
            'radial-gradient(50% 160% at 100% 0%, rgba(224,184,90,.16), transparent), radial-gradient(40% 140% at 0% 100%, rgba(18,112,95,.45), transparent)',
        }}
      >
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Brand */}
          <Link href="/record" className={`group flex items-center gap-2.5 rounded-xl ${ring}`}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-[#f0cf7e] to-[#d3a43f] text-[#0c2421] shadow-[0_6px_16px_-6px_rgba(224,184,90,.8)] transition group-hover:scale-105">
              <MoonStar size={18} strokeWidth={2.25} />
            </span>
            <span className="font-serif text-[17px] font-semibold tracking-tight text-[#f3dca4]">Namaz Tracker</span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-1 rounded-2xl bg-white/6 p-1 ring-1 ring-white/10 md:flex">
            {links.map(([h, l, , Icon]) => (
              <li key={h}>
                <Link
                  href={h}
                  aria-current={active(h) ? 'page' : undefined}
                  className={`relative flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${ring} ${
                    active(h) ? 'text-[#0c2421]' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {active(h) && (
                    <motion.span
                      layoutId="nav-pill-desktop"
                      transition={spring}
                      className="absolute inset-0 rounded-xl bg-linear-to-b from-[#f3dca4] to-[#e0b85a] shadow-[0_6px_16px_-8px_rgba(224,184,90,.9)]"
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon size={16} />
                    {l}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* User + logout */}
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full bg-white/6 py-1 pl-1 pr-3 text-sm ring-1 ring-white/10 lg:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0f5c52] font-serif text-xs font-semibold text-[#e0b85a]">
                {initial}
              </span>
              <span className="max-w-36 truncate text-white/80">{username}</span>
            </span>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={logout}
              disabled={busy}
              aria-label={`Log out (${username})`}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 ${ring}`}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              <span className="hidden sm:inline">{busy ? 'Logging out…' : 'Log out'}</span>
            </motion.button>
          </div>
        </nav>
      </motion.header>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0c2421]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto grid h-17 max-w-md grid-cols-3 gap-1 px-2 py-2">
          {links.map(([h, , short, Icon]) => (
            <li key={h} className="min-w-0">
              <Link
                href={h}
                aria-current={active(h) ? 'page' : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition-colors ${ring} ${
                  active(h) ? 'text-[#0c2421]' : 'text-white/60 active:text-white'
                }`}
              >
                {active(h) && (
                  <motion.span
                    layoutId="nav-pill-mobile"
                    transition={spring}
                    className="absolute inset-0 rounded-xl bg-linear-to-b from-[#f3dca4] to-[#e0b85a]"
                  />
                )}
                <Icon size={19} className="relative" />
                <span className="relative truncate">{short}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}