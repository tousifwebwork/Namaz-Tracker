'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle, BarChart3, Cake, Camera, Check, CheckCircle2, Eye, EyeOff, Hourglass,
  KeyRound, Loader2, Pencil, RotateCw, ShieldCheck, Target, Trash, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, PRAYERS } from '@/lib/api';

/* ────────────────────────────────────────────────────────────────────────────
   Design tokens (Tailwind class strings)
   Palette: deep emerald (#0f5c52) + warm gold (#e0b85a) on a soft mist surface
──────────────────────────────────────────────────────────────────────────── */
const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b85a] focus-visible:ring-offset-2 focus-visible:ring-offset-white';
const card =
  'rounded-2xl bg-white p-5 ring-1 ring-[#0c2421]/6 shadow-[0_1px_2px_rgba(12,36,33,.04),0_16px_40px_-20px_rgba(12,36,33,.22)] sm:p-7';
const btn = `inline-flex h-11 select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 text-sm font-semibold tracking-[-0.005em] transition duration-150 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${ring}`;
const primary = `${btn} bg-linear-to-b from-[#12705f] to-[#0f5c52] text-white shadow-[0_8px_20px_-10px_rgba(15,92,82,.9),inset_0_1px_0_rgba(255,255,255,.14)] hover:from-[#0f6355] hover:to-[#0b4a42]`;
const ghost = `${btn} bg-white text-[#0c2421] ring-1 ring-[#0c2421]/10 hover:bg-[#0f5c52]/5 hover:ring-[#0c2421]/20`;
const danger = `${btn} bg-red-600 text-white shadow-[0_8px_20px_-10px_rgba(220,38,38,.8)] hover:bg-red-700`;
const field =
  'h-12 w-full rounded-xl bg-white px-4 text-[15px] text-[#0c2421] ring-1 ring-[#0c2421]/10 transition placeholder:text-[#0c2421]/35 hover:ring-[#0c2421]/25 focus:outline-none focus:ring-2 focus:ring-[#0f5c52] disabled:cursor-not-allowed';
const eyebrow = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8832f]';

const TABS = [
  ['overview', 'Overview', BarChart3],
  ['edit', 'Edit profile', Pencil],
  ['security', 'Security', KeyRound],
];
const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

/* Crop to a square and shrink to 320px so the upload stays small (~25 KB) */
const toAvatar = (file) =>
  new Promise((res, rej) => {
    if (!file.type.startsWith('image/')) return rej(new Error('Please choose an image file'));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height),
        c = document.createElement('canvas');
      c.width = c.height = 320;
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 320, 320);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => rej(new Error('Could not read that image'));
    img.src = url;
  });

/* ── Motion presets ─────────────────────────────────────────────────────── */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Progress ring ──────────────────────────────────────────────────────── */
function Ring({ value, size = 168, stroke = 13, children }) {
  const reduce = useReducedMotion();
  const gid = useId();
  const r = (size - stroke) / 2,
    c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${value.toFixed(1)} percent completed`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0cf7e" />
            <stop offset="100%" stopColor="#d3a43f" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#0f5c52" strokeOpacity=".09" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - Math.min(100, value) / 100) : c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(100, value) / 100) }}
          transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute text-center">{children}</div>
    </div>
  );
}

/* ── Confirm-delete modal ───────────────────────────────────────────────── */
function Modal({ open, onOk, onCancel, busy }) {
  const [v, setV] = useState('');
  const titleId = useId(),
    descId = useId();
  useEffect(() => {
    setV(''); // eslint-disable-line react-hooks/set-state-in-effect
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);
  const ready = v === 'DELETE' && !busy;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-60 grid place-items-end bg-[#071715]/60 p-4 backdrop-blur-sm sm:place-items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}
        >
          <motion.div
            role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId}
            className={`${card} w-full max-w-md`} onClick={(e) => e.stopPropagation()}
            initial={{ y: 28, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <AlertTriangle size={22} />
            </span>
            <h3 id={titleId} className="mt-4 font-serif text-xl font-semibold tracking-tight">Delete all records?</h3>
            <p id={descId} className="mt-1.5 text-sm leading-relaxed text-[#0c2421]/60">
              This cannot be undone. Every saved prayer will be permanently removed.
            </p>
            <input
              autoFocus className={`${field} mt-5`} placeholder="Type DELETE to confirm" value={v}
              onChange={(e) => setV(e.target.value)} aria-label="Type DELETE to confirm"
              onKeyDown={(e) => e.key === 'Enter' && ready && onOk()}
            />
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className={ghost} onClick={onCancel}>Cancel</button>
              <button className={danger} disabled={!ready} onClick={onOk}>
                {busy && <Loader2 size={16} className="animate-spin" />}
                {busy ? 'Deleting…' : 'Delete everything'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const Label = ({ t, hint, children }) => (
  <label className="block text-sm font-semibold text-[#0c2421]">
    {t}
    {children}
    {hint && <span className="mt-2 block text-xs font-normal leading-relaxed text-[#0c2421]/50">{hint}</span>}
  </label>
);

const SectionHead = ({ title, sub, icon: Icon }) => (
  <div className="flex items-start gap-3">
    {Icon && (
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0f5c52]/8 text-[#0f5c52]">
        <Icon size={18} />
      </span>
    )}
    <div>
      <h2 className="font-serif text-xl font-semibold tracking-tight text-[#0c2421]">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-[#0c2421]/55">{sub}</p>}
    </div>
  </div>
);

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const [p, setP] = useState(null);
  const [err, setErr] = useState(false);
  const [tab, setTab] = useState('overview');
  const [dob, setDob] = useState('');
  const [name, setName] = useState('');
  const [av, setAv] = useState(null);
  const [saving, setSaving] = useState(false);
  const [wipe, setWipe] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [pw, setPw] = useState({ cur: '', next: '', conf: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    setErr(false);
    return api('/api/profile')
      .then((d) => {
        setP(d);
        setDob(d.dob?.slice(0, 10) || '');
        setName(d.name || '');
        setAv(d.avatar || null);
      })
      .catch((e) => {
        toast.error(e.message);
        setErr(true);
      });
  };
  useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      setAv(await toAvatar(f));
      setTab('edit');
      toast.success('Photo ready. Save to keep it.');
    } catch (x) {
      toast.error(x.message);
    }
  };

  const base = { dob: p?.dob?.slice(0, 10) || '', name: p?.name || '', av: p?.avatar || null };
  const dirty = !!p && (dob !== base.dob || name.trim() !== base.name || av !== base.av);

  const save = async () => {
    if (!dob && name.trim() === base.name && av === base.av) return toast.error('Choose your date of birth first');
    setSaving(true);
    try {
      await api('/api/profile', 'PUT', { ...(dob && { dob }), name: name.trim(), avatar: av });
      toast.success('Profile updated');
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };
  const discard = () => {
    setDob(base.dob);
    setName(base.name);
    setAv(base.av);
  };

  const reset = async () => {
    setWiping(true);
    try {
      await api('/api/prayers', 'DELETE');
      toast.success('All records deleted');
      setWipe(false);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setWiping(false);
    }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.next.length < 6) return toast.error('New password must be at least 6 characters');
    if (pw.next !== pw.conf) return toast.error('Passwords do not match');
    setPwBusy(true);
    try {
      await api('/api/auth/password', 'PUT', { currentPassword: pw.cur, newPassword: pw.next });
      toast.success('Password changed');
      setPw({ cur: '', next: '', conf: '' });
    } catch (x) {
      toast.error(x.message);
    } finally {
      setPwBusy(false);
    }
  };

  /* Arrow-key navigation for the tablist (a11y) */
  const onTabKey = (e) => {
    const i = TABS.findIndex(([k]) => k === tab);
    const n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : null;
    if (n === null) return;
    e.preventDefault();
    const next = TABS[(n + TABS.length) % TABS.length][0];
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  /* ── Error state ── */
  if (err)
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${card} grid place-items-center gap-3 py-16 text-center`} role="alert">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100"><AlertTriangle size={24} /></span>
        <p className="font-serif text-xl font-semibold tracking-tight">Couldn’t load your profile</p>
        <p className="max-w-xs text-sm text-[#0c2421]/55">Check your connection and try again.</p>
        <button className={`${primary} mt-2`} onClick={load}><RotateCw size={16} />Try again</button>
      </motion.div>
    );

  /* ── Loading skeleton ── */
  if (!p)
    return (
      <div className="space-y-5" aria-busy="true" aria-label="Loading profile">
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          <div className="h-28 animate-pulse bg-black/6 sm:h-36" />
          <div className="space-y-3 px-6 pb-6">
            <div className="-mt-12 h-24 w-24 animate-pulse rounded-full bg-black/10 ring-4 ring-white" />
            <div className="h-6 w-48 animate-pulse rounded-lg bg-black/6" />
            <div className="h-4 w-28 animate-pulse rounded-lg bg-black/5" />
          </div>
        </div>
        <div className="h-14 w-full animate-pulse rounded-2xl bg-black/5 sm:w-105" />
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <div className="h-56 animate-pulse rounded-2xl bg-black/5 md:w-72" />
          <div className="grid grid-cols-3 gap-3"><div className="animate-pulse rounded-2xl bg-black/5" /><div className="animate-pulse rounded-2xl bg-black/5" /><div className="animate-pulse rounded-2xl bg-black/5" /></div>
        </div>
      </div>
    );

  const s = p.stats;
  const shownName = p.name || p.username;
  const initial = shownName[0]?.toUpperCase();
  const tiles = s
    ? [
        ['Required since 12', s.required, Target, 'text-[#0f5c52] bg-[#0f5c52]/8'],
        ['Offered', s.offered, CheckCircle2, 'text-emerald-700 bg-emerald-50'],
        ['Remaining', s.remaining, Hourglass, 'text-[#a8832f] bg-[#e0b85a]/18'],
      ]
    : [];

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-5 overflow-hidden sm:space-y-6">
      {/* ── Header ── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className=" overflow-hidden rounded-2xl bg-white ring-1 ring-[#0c2421]/6 shadow-[0_16px_40px_-20px_rgba(12,36,33,.25)]"
      >
        <div
          className="relative h-28 sm:h-40"
          style={{
            backgroundColor: '#0c2421',
            backgroundImage:
              'radial-gradient(60% 130% at 92% 0%, rgba(224,184,90,.38), transparent), radial-gradient(45% 90% at 0% 100%, rgba(18,112,95,.75), transparent), linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)',
            backgroundSize: 'auto, auto, 32px 32px, 32px 32px',
          }}
        >
          <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-black/20 to-transparent" />
        </div>
        <div className="px-5 pb-6 sm:px-8 sm:pb-7">
          <div className="-mt-12 flex items-end justify-between gap-3 sm:-mt-16">
            <div className="relative">
              <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-linear-to-br from-[#12705f] to-[#0b4a42] font-serif text-4xl font-semibold text-[#e0b85a] shadow-lg ring-4 ring-white sm:h-32 sm:w-32 sm:text-5xl">
                {(tab === 'edit' ? av : p.avatar) ? (
                  <img src={tab === 'edit' ? av : p.avatar} alt={`${shownName}’s photo`} className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={() => fileRef.current?.click()} aria-label="Change profile photo"
                className={`absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-[#e0b85a] text-[#0c2421] shadow-md ring-2 ring-white ${ring}`}
              >
                <Camera size={16} />
              </motion.button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
            </div>
            {p.age12Date && (
              <span className="mb-1 hidden items-center gap-2 rounded-full bg-[#f3f6f5] px-4 py-2 text-xs font-semibold text-[#0c2421]/65 ring-1 ring-[#0c2421]/5 sm:flex">
                <Cake size={14} className="text-[#a8832f]" />Turned 12 on {fmtDate(p.age12Date)}
              </span>
            )}
          </div>
          <h1 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-[#0c2421] sm:text-[2rem]">{shownName}</h1>
          <p className="text-sm text-[#0c2421]/55">@{p.username}</p>
          {p.age12Date && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0c2421]/55 sm:hidden">
              <Cake size={13} className="text-[#a8832f]" />Turned 12 on {fmtDate(p.age12Date)}
            </p>
          )}
        </div>
      </motion.section>

      {/* ── Tabs ── */}
      <div
        role="tablist" aria-label="Profile sections" onKeyDown={onTabKey}
        className="mx-auto grid w-full grid-cols-3 gap-1 rounded-2xl bg-white p-1.5 ring-1 ring-[#0c2421]/6 shadow-sm sm:w-fit"
      >
        {TABS.map(([k, l, Icon]) => (
          <button
            key={k} id={`tab-${k}`} role="tab" aria-selected={tab === k} aria-controls={`panel-${k}`} tabIndex={tab === k ? 0 : -1}
            onClick={() => setTab(k)}
            className={`relative flex h-11 items-center justify-center gap-2 rounded-xl px-2 text-[13px] font-semibold transition-colors sm:px-6 sm:text-sm ${ring} ${tab === k ? 'text-white' : 'text-[#0c2421]/55 hover:text-[#0c2421]'}`}
          >
            {tab === k && (
              <motion.span layoutId="ptab" className="absolute inset-0 rounded-xl bg-linear-to-b from-[#12705f] to-[#0f5c52] shadow-[0_6px_16px_-8px_rgba(15,92,82,.9)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
            )}
            <span className="relative flex items-center gap-2"><Icon size={16} /><span className="truncate">{l}</span></span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab} id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className={`space-y-5 sm:space-y-6 ${ring} rounded-2xl`}
        >
          {/* ── OVERVIEW ── */}
          {tab === 'overview' &&
            (!s ? (
              <section className={`${card} grid place-items-center gap-3 py-16 text-center`}>
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e0b85a]/15 text-[#a8832f] ring-1 ring-[#e0b85a]/30"><Cake size={28} /></span>
                <h2 className="font-serif text-xl font-semibold tracking-tight">Add your date of birth</h2>
                <p className="max-w-xs text-sm leading-relaxed text-[#0c2421]/55">We’ll count the prayers due since you turned 12 and show how many remain.</p>
                <button className={`${primary} mt-2`} onClick={() => setTab('edit')}><Pencil size={16} />Add date of birth</button>
              </section>
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 sm:space-y-6">
                <section className="grid min-w-0 gap-4 sm:gap-5 md:grid-cols-[minmax(220px,auto)_minmax(0,1fr)]">
                          <motion.div variants={rise} className={`${card} flex min-w-0 flex-col items-center justify-center gap-4 md:px-10 lg:px-14`}>
                    <Ring value={s.percent}>
                      <div className="font-serif text-4xl font-semibold tabular-nums tracking-tight text-[#0c2421]">{s.percent.toFixed(1)}%</div>
                      <div className="mt-0.5 text-xs font-medium text-[#0c2421]/55">completed</div>
                    </Ring>
                  </motion.div>
                  <div className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-3 sm:gap-4">
                    {tiles.map(([l, v, Icon, tone]) => (
                      <motion.div
                        key={l} variants={rise} whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className={`${card} min-w-0 flex flex-col justify-between gap-4 p-4! sm:p-6!`}
                      >
                        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon size={17} /></span>
                        <div>
                          <div className="font-serif text-3xl font-semibold tabular-nums tracking-tight text-[#0c2421] sm:text-4xl">{v.toLocaleString()}</div>
                          <div className="mt-1 text-xs leading-tight text-[#0c2421]/55 sm:text-sm">{l}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                <motion.section variants={rise} className={card}>
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className={eyebrow}>Progress</p>
                      <h2 className="mt-1 font-serif text-xl font-semibold tracking-tight">By prayer</h2>
                    </div>
                    <p className="rounded-full bg-[#f3f6f5] px-3 py-1.5 text-xs font-semibold text-[#0c2421]/60">
                      {s.remaining > 0 ? `About ${Math.ceil(s.remaining / 5).toLocaleString()} days of prayers left to make up` : 'You are all caught up'}
                    </p>
                  </div>
                  <div className="mt-6 space-y-5">
                    {PRAYERS.map((k, i) => {
                      const b = s.byPrayer[k] || { required: 0, offered: 0 };
                      const w = b.required ? Math.min(100, (b.offered / b.required) * 100) : 0;
                      return (
                        <div key={k}>
                          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                            <span className="font-semibold capitalize text-[#0c2421]">{k}</span>
                            <span className="text-xs tabular-nums text-[#0c2421]/55 sm:text-sm">
                              <b className="text-[#0c2421]">{b.offered.toLocaleString()}</b> / {b.required.toLocaleString()}
                              <span className="ml-2 rounded-md bg-[#0f5c52]/8 px-1.5 py-0.5 text-[11px] font-semibold text-[#0f5c52]">{w.toFixed(0)}%</span>
                            </span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-[#0f5c52]/10" role="progressbar" aria-label={`${k} progress`} aria-valuenow={Math.round(w)} aria-valuemin={0} aria-valuemax={100}>
                            <motion.div
                              className="h-full rounded-full bg-linear-to-r from-[#0f5c52] to-[#2a8a7a]"
                              initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 0.9, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.section>
              </motion.div>
            ))}

          {/* ── EDIT ── */}
          {tab === 'edit' && (
            <section className={`${card} space-y-7`}>
              <SectionHead title="Edit profile" sub="Update your photo and personal details." icon={Pencil} />
              <div className="flex flex-col gap-4 rounded-2xl bg-[#f3f6f5] p-4 ring-1 ring-[#0c2421]/5 min-[480px]:flex-row min-[480px]:items-center">
                <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-linear-to-br from-[#12705f] to-[#0b4a42] font-serif text-3xl font-semibold text-[#e0b85a] ring-4 ring-white">
                  {av ? <img src={av} alt="" className="h-full w-full object-cover" /> : initial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0c2421]">Profile photo</p>
                  <p className="mb-3 text-xs text-[#0c2421]/50">Cropped to a square automatically.</p>
                  <div className="flex flex-wrap gap-2">
                    <button className={ghost} onClick={() => fileRef.current?.click()}><Camera size={16} />{av ? 'Change photo' : 'Upload photo'}</button>
                    {av && <button className={`${ghost} text-red-700! hover:bg-red-50!`} onClick={() => setAv(null)}><Trash size={16} />Remove</button>}
                  </div>
                </div>
              </div>
              <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                <Label t="Display name" hint="Shown on your profile instead of your username.">
                  <input className={`${field} mt-2 font-normal`} maxLength={40} placeholder={p.username} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </Label>
                <Label t="Username" hint="Your username can’t be changed.">
                  <input className={`${field} mt-2 bg-[#f3f6f5] font-normal text-[#0c2421]/50`} value={p.username} disabled readOnly />
                </Label>
                <Label t="Date of birth" hint={dob ? 'Prayers are counted from the day you turned 12.' : 'Needed to calculate prayers owed since age 12.'}>
                  <input type="date" className={`${field} mt-2 font-normal`} value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} />
                </Label>
              </div>
              <AnimatePresence>
                {dirty && (
                  <motion.div
                    initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                    className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 border-t border-black/5 bg-white/90 p-3 backdrop-blur-xl md:static md:z-auto md:justify-end md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
                  >
                    <span className="mr-auto hidden items-center gap-2 text-xs font-medium text-[#0c2421]/55 md:flex">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#e0b85a]" />Unsaved changes
                    </span>
                    <button className={`${ghost} flex-1 md:flex-none`} onClick={discard} disabled={saving}>Discard</button>
                    <button className={`${primary} flex-1 md:flex-none`} onClick={save} disabled={saving}>
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}

          {/* ── SECURITY ── */}
          {tab === 'security' && (
            <>
              <form onSubmit={changePw} className={`${card} space-y-6`}>
                <SectionHead title="Change password" sub="Use at least 6 characters." icon={ShieldCheck} />
                <div className="grid min-w-0 gap-4 sm:grid-cols-3">
                  {[
                    ['Current password', 'cur', 'current-password'],
                    ['New password', 'next', 'new-password'],
                    ['Confirm new password', 'conf', 'new-password'],
                  ].map(([l, k, ac]) => (
                    <Label key={k} t={l}>
                      <div className="relative mt-2">
                        <input
                          className={`${field} font-normal`} type={showPw ? 'text' : 'password'} value={pw[k]}
                          onChange={(e) => setPw({ ...pw, [k]: e.target.value })} autoComplete={ac} required
                        />
                      </div>
                    </Label>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button" onClick={() => setShowPw(!showPw)} aria-pressed={showPw}
                    className={`flex h-10 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-[#0c2421]/55 transition hover:text-[#0c2421] ${ring}`}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}{showPw ? 'Hide' : 'Show'} passwords
                  </button>
                  <button className={`${primary} w-full sm:w-auto`} disabled={pwBusy}>
                    {pwBusy && <Loader2 size={16} className="animate-spin" />}
                    {pwBusy ? 'Updating…' : 'Update password'}
                  </button>
                </div>
              </form>

              <section className={`${card} flex flex-wrap items-center justify-between gap-4 bg-red-50/40! ring-red-200!`}>
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600"><Trash2 size={18} /></span>
                  <div>
                    <h2 className="font-serif text-lg font-semibold tracking-tight">Reset records</h2>
                    <p className="text-sm text-[#0c2421]/55">Permanently removes every prayer you have saved.</p>
                  </div>
                </div>
                <button className={`${ghost} w-full text-red-700! ring-red-200! hover:bg-red-50! sm:w-auto`} onClick={() => setWipe(true)}>Delete all</button>
              </section>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <Modal open={wipe} busy={wiping} onOk={reset} onCancel={() => setWipe(false)} />
    </div>
  );
}