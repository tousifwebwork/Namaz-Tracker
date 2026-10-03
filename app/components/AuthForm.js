'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Eye, EyeOff, Lock, MoonStar, ShieldCheck, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const Brand = ({ light }) => (
  <div className={`flex items-center gap-2.5 font-serif text-lg font-semibold ${light ? 'text-white' : 'text-[#0c2421]'}`}>
    <span className={`grid h-10 w-10 place-items-center rounded-xl ${light ? 'bg-white/10' : 'bg-[#0f5c52]'} text-[#e0b85a]`}>
      <MoonStar size={20} />
    </span>
    Namaz Tracker
  </div>
);

export default function AuthForm({ mode }) {
  const router = useRouter();
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/auth/${mode}`, 'POST', { username, password });
      router.replace('/record');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reg = mode === 'register';

  return (
    <main className="min-h-screen bg-[#f3f6f5] lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel (desktop) */}
      <section className="relative hidden overflow-hidden bg-[#0c2421] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div
          aria-hidden
          className="absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              'radial-gradient(55% 45% at 85% 8%, rgba(224,184,90,.30), transparent), radial-gradient(40% 40% at 0% 100%, rgba(15,92,82,.55), transparent), linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
            backgroundSize: 'auto, auto, 40px 40px, 40px 40px',
          }}
        />
        <div className="relative"><Brand light /></div>

        <div className="relative">
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

          <div className="mt-12 flex gap-5 xl:gap-6">
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

        <p className="relative flex items-center gap-2 text-sm text-white/55">
          <ShieldCheck size={16} /> Private by design. Your records belong only to you.
        </p>
      </section>

      {/* Form panel */}
      <section className="flex min-h-screen flex-col lg:min-h-0">
        {/* Mobile / tablet brand header */}
        <div className="relative overflow-hidden bg-[#0c2421] px-6 pb-14 pt-8 lg:hidden">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(70% 90% at 90% 0%, rgba(224,184,90,.30), transparent)' }}
          />
          <div className="relative mx-auto max-w-md"><Brand light /></div>
        </div>

        <div className="-mt-8 flex flex-1 items-start justify-center px-4 pb-10 sm:px-8 lg:mt-0 lg:items-center lg:px-12">
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full max-w-md space-y-6 rounded-3xl bg-white p-6 shadow-[0_20px_50px_-20px_rgba(12,36,33,.25)] ring-1 ring-black/5 sm:p-8 lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-0"
          >
            <div>
              <h1 className="font-serif text-3xl font-semibold text-[#0c2421] sm:text-4xl">
                {reg ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#0c2421]/60 sm:text-base">
                {reg
                  ? 'Pick a username and password. Your records stay private.'
                  : 'Log in to continue your record.'}
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-[#0c2421]">
                Username
                <div className="relative mt-2">
                  <User size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0c2421]/40" />
                  <input
                    className="h-12 w-full rounded-xl bg-white pl-11 pr-4 text-[15px] font-normal text-[#0c2421] ring-1 ring-black/10 transition placeholder:text-black/35 hover:ring-black/20 focus:outline-none focus:ring-2 focus:ring-[#0f5c52]"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setU(e.target.value)}
                    required
                    minLength={3}
                    autoComplete="username"
                  />
                </div>
              </label>

              <label className="block text-sm font-semibold text-[#0c2421]">
                Password
                <div className="relative mt-2">
                  <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0c2421]/40" />
                  <input
                    className="h-12 w-full rounded-xl bg-white pl-11 pr-12 text-[15px] font-normal text-[#0c2421] ring-1 ring-black/10 transition placeholder:text-black/35 hover:ring-black/20 focus:outline-none focus:ring-2 focus:ring-[#0f5c52]"
                    type={show ? 'text' : 'password'}
                    placeholder="Password (min 6 characters)"
                    value={password}
                    onChange={(e) => setP(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={reg ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[#0c2421]/45 transition hover:bg-black/5 hover:text-[#0c2421] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b85a]"
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
            </div>

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f5c52] text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(15,92,82,.7)] transition hover:bg-[#0b4a42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b85a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy && <Loader2 size={18} className="animate-spin" />}
              {busy ? 'Please wait…' : reg ? 'Register' : 'Log in'}
            </motion.button>

            <p className="text-center text-sm text-[#0c2421]/60">
              {reg ? (
                <>Already registered?{' '}
                  <Link className="font-semibold text-[#0f5c52] underline-offset-4 hover:underline" href="/login">Log in</Link></>
              ) : (
                <>New here?{' '}
                  <Link className="font-semibold text-[#0f5c52] underline-offset-4 hover:underline" href="/register">Create an account</Link></>
              )}
            </p>
          </motion.form>
        </div>
      </section>
    </main>
  );
}