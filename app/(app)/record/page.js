'use client';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Sun, CalendarDays, CalendarRange, Flame, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, iso, PRAYERS, hijri } from '@/lib/api';

const empty = { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };
const card = 'rounded-2xl bg-white p-5 ring-1 ring-black/5 shadow-[0_1px_2px_rgba(12,36,33,.04),0_12px_32px_-16px_rgba(12,36,33,.18)] sm:p-6';
const btn = 'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b85a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const primary = `${btn} bg-[#0f5c52] text-white hover:bg-[#0b4a42]`;
const ghost = `${btn} bg-white text-[#0c2421] ring-1 ring-black/10 hover:bg-[#0f5c52]/5`;
const LV = ['bg-[#e7edeb]', 'bg-[#c9e2da]', 'bg-[#8fc4b5]', 'bg-[#4f9c89]', 'bg-[#1f7565]', 'bg-[#e0b85a]'];
const sz = 'w-3 sm:w-3.5';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const wrap = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function Ring({ value, size = 72, stroke = 7, children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#0f5c52" strokeOpacity=".1" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e0b85a" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }} transition={{ duration: 0.7, ease: 'easeOut' }} />
      </svg>
      <div className="absolute text-lg font-bold">{children}</div>
    </div>
  );
}

function Modal({ ask, date, onOk, onCancel }) {
  useEffect(() => {
    if (!ask) return;
    const k = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [ask, onCancel]);
  return (
    <AnimatePresence>
      {ask && (
        <motion.div className="fixed inset-0 z-60 grid place-items-end bg-[#0c2421]/50 p-4 backdrop-blur-sm sm:place-items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
          <motion.div role="dialog" aria-modal="true" className={`${card} w-full max-w-sm`} onClick={(e) => e.stopPropagation()}
            initial={{ y: 24, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}>
            <h3 className="font-serif text-xl font-semibold">{ask.done ? 'Mark' : 'Unmark'} full {ask.scope}?</h3>
            <p className="mt-1.5 text-sm text-[#0c2421]/60">Every prayer for the full {ask.scope} of {date} will be {ask.done ? 'marked as offered' : 'cleared'}.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className={ghost} onClick={onCancel}>Cancel</button>
              <button className={`${btn} text-white ${ask.done ? 'bg-[#0f5c52] hover:bg-[#0b4a42]' : 'bg-red-600 hover:bg-red-700'}`} onClick={onOk}>{ask.done ? 'Mark all' : 'Unmark all'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Heatmap({ year, days, loading, error, selected, onPick, onYear, onRetry }) {
  const [hov, setHov] = useState(null);
  const scroller = useRef(null);
  const today = iso(new Date());
  const { cells, cols, labels, total, full, best } = useMemo(() => {
    const off = new Date(year, 0, 1).getDay();
    const n = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
    const cols = Math.ceil((off + n) / 7);
    const cells = Array.from({ length: cols * 7 }, (_, i) => (i - off >= 0 && i - off < n ? iso(new Date(year, 0, 1 + i - off)) : null));
    const labels = Array.from({ length: cols }, (_, c) => {
      const column = cells.slice(c * 7, c * 7 + 7).filter(Boolean);
      const firstOfMonth = column.find((d) => d.slice(8, 10) === '01');
      return firstOfMonth ? MON[+firstOfMonth.slice(5, 7) - 1] : '';
    });
    let total = 0, full = 0, run = 0, best = 0;
    cells.forEach((d) => {
      if (!d || d > today) return;
      const v = days[d] || 0; total += v;
      if (v === 5) { full++; run++; best = Math.max(best, run); } else run = 0;
    });
    return { cells, cols, labels, total, full, best };
  }, [year, days, today]);

  useEffect(() => {
    if (!loading && scroller.current && year === new Date().getFullYear()) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [loading, year]);

  const stats = [[total, `Prayers in ${year}`], [full, 'Full days'], [best, 'Best streak']];
  const hd = hov ? new Date(hov + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-semibold">Prayer history</h2>
          <p className="text-sm text-[#0c2421]/60">Every day of the year at a glance. Tap a day to open it.</p>
        </div>
        <div className="flex items-center gap-1">
          <button className={`${ghost} w-10 px-0!`} onClick={() => onYear(year - 1)} aria-label="Previous year"><ChevronLeft size={16} /></button>
          <span className="w-14 text-center text-sm font-bold">{year}</span>
          <button className={`${ghost} w-10 px-0!`} onClick={() => onYear(year + 1)} disabled={year >= new Date().getFullYear()} aria-label="Next year"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map(([v, l], i) => (
          <div key={l} className="rounded-xl bg-[#f3f6f5] px-3 py-2.5">
            <div className="flex items-center gap-1.5 font-serif text-2xl font-semibold">{i === 2 && <Flame size={18} className="text-[#d49a1f]" />}{v}</div>
            <div className="text-[11px] font-medium text-[#0c2421]/55 sm:text-xs">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        {loading ? <div className="h-32.5 animate-pulse rounded-xl bg-black/5" /> : error ? (
          <div className="grid place-items-center gap-3 rounded-xl bg-[#f3f6f5] py-10 text-center">
            <p className="text-sm text-[#0c2421]/70">Couldn’t load your history.</p>
            <button className={ghost} onClick={onRetry}><RotateCw size={15} />Try again</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="mt-5 grid shrink-0 grid-rows-7 gap-0.75 text-[10px] font-medium text-[#0c2421]/45">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((w, i) => <span key={i} className="flex h-3 items-center sm:h-3.5">{w}</span>)}
            </div>
            <div ref={scroller} className="min-w-0 flex-1 overflow-x-auto pb-2">
              <motion.div key={year} className="w-max" initial={{ clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 0.9, ease: 'easeOut' }}>
                <div className="mb-1 flex h-4 gap-0.75 text-[10px] font-medium text-[#0c2421]/55">
                  {labels.map((l, i) => <span key={i} className={`relative ${sz}`}><span className="absolute left-0 whitespace-nowrap">{l}</span></span>)}
                </div>
                <div className="grid grid-flow-col grid-rows-7 gap-0.75" style={{ gridTemplateColumns: `repeat(${cols}, max-content)` }}>
                  {cells.map((d, i) => {
                    if (!d) return <span key={i} className={`${sz} aspect-square`} />;
                    const v = days[d] || 0, future = d > today;
                    return (
                      <button key={d} disabled={future} onClick={() => onPick(d)} onMouseEnter={() => setHov(d)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(d)} onBlur={() => setHov(null)}
                        aria-label={`${v} of 5 prayers on ${d}`}
                        className={`${sz} aspect-square rounded-[3px] transition hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c2421] ${future ? 'bg-transparent ring-1 ring-black/5' : LV[v]} ${d === selected ? 'ring-2 ring-[#0c2421] ring-offset-1' : ''} ${d === today ? 'outline-1 outline-offset-1 outline-[#0f5c52]' : ''}`} />
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#0c2421]/60">
        <span className="min-h-4 font-medium text-[#0c2421]">{hov ? `${days[hov] || 0} of 5 prayers · ${hd}` : 'Hover over a day for details'}</span>
        <span className="flex items-center gap-1.5">Less {LV.map((c, i) => <i key={i} className={`h-3 w-3 rounded-[3px] ${c}`} />)} More</span>
      </div>
    </div>
  );
}

function Record() {
  const params = useSearchParams();
  const [date, setDate] = useState(params.get('date') || iso(new Date()));
  const [day, setDay] = useState(empty);
  const [stats, setStats] = useState({ today: 0, month: 0, year: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(null);
  const [year, setYear] = useState(+date.slice(0, 4));
  const [hist, setHist] = useState({ days: {}, loading: true, error: false });

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await api(`/api/prayers?date=${date}`); setDay({ ...empty, ...d.day }); setStats(d.stats); }
    catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }, [date]);
  const loadHist = useCallback(async () => {
    setHist((h) => ({ ...h, loading: true, error: false }));
    try { const d = await api(`/api/prayers/history?year=${year}`); setHist({ days: d.days || {}, loading: false, error: false }); }
    catch { setHist({ days: {}, loading: false, error: true }); }
  }, [year]);
  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect
  useEffect(() => { loadHist(); }, [loadHist]); // eslint-disable-line react-hooks/set-state-in-effect

  const setCount = (obj) => setHist((h) => (date.startsWith(String(year)) ? { ...h, days: { ...h.days, [date]: PRAYERS.filter((p) => obj[p]).length } } : h));
  const toggle = async (p) => {
    const next = !day[p]; const after = { ...day, [p]: next };
    setDay(after); setCount(after); // optimistic
    try { const d = await api('/api/prayers', 'POST', { date, prayer: p, done: next }); setStats(d.stats); }
    catch (e) { setDay(day); setCount(day); toast.error(e.message); }
  };
  const bulk = async () => {
    const { scope, done } = ask; setAsk(null); setBusy(true);
    try { await api('/api/prayers/bulk', 'POST', { date, scope, done }); toast.success(`Full ${scope} ${done ? 'marked' : 'unmarked'}`); await Promise.all([load(), loadHist()]); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const shift = (n) => { const x = new Date(date + 'T00:00:00'); x.setDate(x.getDate() + n); setDate(iso(x)); };
  const count = PRAYERS.filter((p) => day[p]).length;
  const d = new Date(date + 'T00:00:00');
  const cards = [['Today', stats.today, Sun], ['This month', stats.month, CalendarDays], ['This year', stats.year, CalendarRange]];

  return (
    <motion.div variants={wrap} initial="hidden" animate="show" className="space-y-5">
      <motion.section variants={item} className={`${card} flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <h1 className="font-serif text-2xl font-semibold sm:text-3xl">{d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h1>
          <p className="mt-1 text-sm font-semibold text-[#a8832f]">{hijri(d)}</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button className={`${ghost} w-11 px-0!`} onClick={() => shift(-1)} aria-label="Previous day"><ChevronLeft size={18} /></button>
          <input type="date" aria-label="Select date" value={date} onChange={(e) => { if (e.target.value) { setDate(e.target.value); setYear(+e.target.value.slice(0, 4)); } }}
            className="h-11 min-w-0 flex-1 rounded-xl bg-white px-3 text-sm ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-[#0f5c52] sm:w-44 sm:flex-none" />
          <button className={`${ghost} w-11 px-0!`} onClick={() => shift(1)} aria-label="Next day"><ChevronRight size={18} /></button>
          <button className={primary} onClick={() => setDate(iso(new Date()))}>Today</button>
        </div>
      </motion.section>

      <motion.section variants={item} className={card}>
        <div className="mb-6 flex items-center gap-4">
          <Ring value={count * 20}>{count}/5</Ring>
          <div>
            <h2 className="font-serif text-xl font-semibold">{count === 5 ? 'All prayers offered' : `${5 - count} prayer${5 - count === 1 ? '' : 's'} left`}</h2>
            <p className="text-sm text-[#0c2421]/60">Tap a prayer to mark it offered. Tap again to undo.</p>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-5 gap-2 sm:gap-4">{PRAYERS.map((p) => <div key={p} className="h-28 animate-pulse rounded-2xl bg-black/5" />)}</div>
        ) : (
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {PRAYERS.map((p, i) => (
              <motion.button key={p} onClick={() => toggle(p)} aria-pressed={day[p]} aria-label={`${p}: ${day[p] ? 'offered' : 'not offered'}`}
                whileTap={{ scale: 0.92 }} whileHover={{ y: -2 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex flex-col items-center gap-2.5 rounded-2xl px-1 py-4 ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b85a] sm:py-6 ${day[p] ? 'bg-[#0f5c52]/5 ring-[#0f5c52]/30' : 'bg-white ring-black/10 hover:ring-[#e0b85a]'}`}>
                <span className={`grid h-12 w-12 place-items-center rounded-full border-2 transition sm:h-16 sm:w-16 ${day[p] ? 'border-[#0f5c52] bg-[#0f5c52] text-white' : 'border-black/15 text-transparent'}`}>
                  <motion.span animate={{ scale: day[p] ? 1 : 0.4, opacity: day[p] ? 1 : 0 }} transition={{ type: 'spring', stiffness: 420, damping: 20 }}><Check size={24} strokeWidth={3} /></motion.span>
                </span>
                <span className="text-xs font-semibold capitalize sm:text-sm">{p}</span>
              </motion.button>
            ))}
          </div>
        )}
      </motion.section>

      <motion.section variants={item} className="grid grid-cols-3 gap-3 sm:gap-4">
        {cards.map(([l, v, Icon]) => (
          <div key={l} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 shadow-[0_12px_32px_-16px_rgba(12,36,33,.18)] sm:p-5">
            <Icon size={18} className="text-[#a8832f]" />
            <AnimatePresence mode="wait">
              <motion.div key={v} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">{v}</motion.div>
            </AnimatePresence>
            <div className="text-xs text-[#0c2421]/60 sm:text-sm">{l}</div>
          </div>
        ))}
      </motion.section>

      <motion.section variants={item}>
        <Heatmap year={year} days={hist.days} loading={hist.loading} error={hist.error} selected={date} onPick={(x) => { setDate(x); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onYear={setYear} onRetry={loadHist} />
      </motion.section>

      <motion.section variants={item} className={card}>
        <h2 className="font-serif text-xl font-semibold">Bulk actions</h2>
        <p className="mt-1 text-sm text-[#0c2421]/60">Apply to the full day, month or year of the selected date.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {['day', 'month', 'year'].map((s) => (
            <div key={s} className="space-y-2 rounded-xl bg-[#f3f6f5] p-3">
              <p className="text-sm font-semibold capitalize">Full {s}</p>
              <button disabled={busy} className={`${primary} w-full`} onClick={() => setAsk({ scope: s, done: true })}>Mark full {s}</button>
              <button disabled={busy} className={`${ghost} w-full`} onClick={() => setAsk({ scope: s, done: false })}>Unmark full {s}</button>
            </div>
          ))}
        </div>
      </motion.section>
      <Modal ask={ask} date={date} onOk={bulk} onCancel={() => setAsk(null)} />
    </motion.div>
  );
}
export default function Page() { return <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-black/5" />}><Record /></Suspense>; }