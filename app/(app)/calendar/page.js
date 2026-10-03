'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, CalendarCheck2, MoonStar } from 'lucide-react';
import { iso } from '@/lib/api';

/* ---------- Hijri (Indian / Urdu style) ---------- */
const EN = ['Muharram', 'Safar', 'Rabi ul Awwal', 'Rabi us Saani', 'Jumada ul Awwal', 'Jumada us Saani', 'Rajab', 'Shaban', 'Ramzan', 'Shawwal', 'Zil Qada', 'Zil Hijja'];
const UR = ['محرم', 'صفر', 'ربیع الاول', 'ربیع الثانی', 'جمادی الاول', 'جمادی الثانی', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذوالقعدہ', 'ذوالحجہ'];
const WEEK = [['Sun', 'اتوار'], ['Mon', 'پیر'], ['Tue', 'منگل'], ['Wed', 'بدھ'], ['Thu', 'جمعرات'], ['Fri', 'جمعہ'], ['Sat', 'ہفتہ']];
const urFont = { fontFamily: "'Noto Nastaliq Urdu','Jameel Noori Nastaleeq','Noto Naskh Arabic',serif" };
const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' });
const urDigits = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

// off = days to shift (India usually sights the moon about a day after Saudi Arabia)
function hijri(d, off) {
  const parts = fmt.formatToParts(new Date(d.getFullYear(), d.getMonth(), d.getDate() + off, 12));
  const g = (t) => +parts.find((p) => p.type === t || (t === 'year' && p.type === 'relatedYear')).value;
  return { d: g('day'), m: g('month') - 1, y: g('year') };
}

const OFFSETS = [[-1, 'India (−1 day)'], [0, 'Saudi (Umm al-Qura)'], [1, '+1 day']];
const ring = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e0b85a] focus-visible:ring-offset-2';
const card = 'min-w-0 rounded-2xl bg-white p-5 ring-1 ring-black/5 shadow-[0_1px_2px_rgba(12,36,33,.04),0_12px_32px_-16px_rgba(12,36,33,.18)] sm:p-6';
const navBtn = `grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[#0c2421] ring-1 ring-black/10 transition hover:bg-[#0f5c52]/5 active:scale-95 ${ring}`;
const grid7 = 'grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1 sm:gap-1.5';

export default function CalendarPage() {
  const router = useRouter();
  const [view, setView] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [sel, setSel] = useState(new Date());
  const [dir, setDir] = useState(1);
  const [off, setOff] = useState(-1);

  useEffect(() => { try { const v = localStorage.getItem('hijriOffset'); if (v !== null) setOff(+v); } catch {} }, []); // eslint-disable-line react-hooks/set-state-in-effect
  const changeOff = (v) => { setOff(v); try { localStorage.setItem('hijriOffset', String(v)); } catch {} };

  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = useMemo(
    () => [...Array(view.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))],
    [view, days]
  );
  const move = (n) => { setDir(n); setView(new Date(view.getFullYear(), view.getMonth() + n, 1)); };
  const goToday = () => { const n = new Date(); setDir(n < view ? -1 : 1); setView(new Date(n.getFullYear(), n.getMonth(), 1)); setSel(n); };

  const today = iso(new Date());
  const h1 = hijri(new Date(view.getFullYear(), view.getMonth(), 1), off);
  const h2 = hijri(new Date(view.getFullYear(), view.getMonth(), days), off);
  const range = (k) => (h1.m === h2.m ? `${k[h1.m]}` : `${k[h1.m]} – ${k[h2.m]}`);
  const hs = hijri(sel, off);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Calendar */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={card}>
        <div className="mb-5 flex items-center justify-between gap-2">
          <button className={navBtn} onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <div className="min-w-0 flex-1 text-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={iso(view)} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}>
                <h1 className="font-serif text-2xl font-semibold sm:text-3xl">{view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h1>
                <p className="mt-0.5 text-balance text-xs font-semibold text-[#a8832f] sm:text-sm">{range(EN)} {h2.y} AH</p>
                <p dir="rtl" style={urFont} className="text-balance text-sm leading-[1.9] text-[#a8832f] sm:text-base">{range(UR)} {urDigits(h2.y)} ھ</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <button className={navBtn} onClick={() => move(1)} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>

        <div className={grid7}>
          {WEEK.map(([e, u], i) => (
            <div key={e} className={`py-1.5 text-center ${i === 5 ? 'text-[#0f5c52]' : 'text-black/45'}`}>
              <div className="text-xs font-semibold">{e}</div>
              <div style={urFont} className="hidden text-[11px] leading-[1.8] sm:block" dir="rtl">{u}</div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={iso(view)} initial={{ opacity: 0, x: dir * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -24 }} transition={{ duration: 0.2 }} className={grid7}>
            {cells.map((c, i) => {
              if (!c) return <div key={i} />;
              const h = hijri(c, off), on = iso(c) === iso(sel), isToday = iso(c) === today, fri = c.getDay() === 5;
              return (
                <motion.button key={i} onClick={() => setSel(c)} whileHover={{ y: -1 }} whileTap={{ scale: 0.94 }}
                  aria-label={`${c.toDateString()}, ${h.d} ${EN[h.m]} ${h.y} AH`} aria-pressed={on}
                  className={`relative flex aspect-square min-w-0 flex-col items-center justify-center rounded-xl transition ${ring} ${isToday && !on ? 'bg-[#e0b85a]/15 ring-1 ring-[#e0b85a]' : !on ? (fri ? 'bg-[#0f5c52]/4 hover:bg-[#0f5c52]/10' : 'hover:bg-[#0f5c52]/5') : ''}`}>
                  {on && <motion.span layoutId="sel" className="absolute inset-0 rounded-xl bg-[#0f5c52] shadow-[0_8px_18px_-8px_rgba(15,92,82,.8)]" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                  <span className={`relative text-sm font-semibold sm:text-base ${on ? 'text-white' : ''}`}>{c.getDate()}</span>
                  <span className={`relative text-[10px] sm:text-[11px] ${on ? 'text-[#f0d28a]' : 'text-[#a8832f]'}`}>{h.d}</span>
                  {h.d === 1 && <i className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${on ? 'bg-[#f0d28a]' : 'bg-[#e0b85a]'}`} />}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/5 pt-4 text-xs text-black/55">
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#e0b85a]" />First day of Islamic month</span>
          <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-[#e0b85a]/20 ring-1 ring-[#e0b85a]" />Today</span>
          <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-[#0f5c52]/10" />Friday (Jumu‘ah)</span>
        </div>
      </motion.section>

      {/* Side panel */}
      <motion.aside initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className={`${card} space-y-5`}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f5c52] text-[#e0b85a]"><MoonStar size={18} /></span>
            <p className="text-sm font-semibold text-black/55">Selected date</p>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={iso(sel) + off} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <p className="font-serif text-3xl font-semibold leading-tight">{sel.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}</p>
              <p className="text-sm text-black/55">{sel.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric' })}</p>
              <div className="mt-4 rounded-xl bg-[#0c2421] p-4 text-white">
                <p dir="rtl" style={urFont} className="text-2xl leading-loose text-[#f0d28a]">{urDigits(hs.d)} {UR[hs.m]} {urDigits(hs.y)} ھ</p>
                <p className="text-sm text-white/70">{hs.d} {EN[hs.m]} {hs.y} AH</p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="space-y-2">
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => router.push(`/record?date=${iso(sel)}`)}
              className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0f5c52] text-sm font-semibold text-white transition hover:bg-[#0b4a42] ${ring}`}>
              Open this day’s record <ArrowRight size={16} />
            </motion.button>
            <button onClick={goToday} className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold ring-1 ring-black/10 transition hover:bg-[#0f5c52]/5 ${ring}`}>
              <CalendarCheck2 size={16} /> Jump to today
            </button>
          </div>
        </div>

        <div className={card}>
          <h2 className="font-serif text-lg font-semibold">Moon-sighting adjustment</h2>
          <p className="mt-1 text-sm leading-relaxed text-black/55">Hijri dates depend on local moon sighting. In India the month usually starts a day after Saudi Arabia. Change this if your local committee differs.</p>
          <div role="radiogroup" aria-label="Hijri date adjustment" className="mt-4 grid gap-1.5 rounded-xl bg-[#f3f6f5] p-1.5">
            {OFFSETS.map(([v, l]) => (
              <button key={v} role="radio" aria-checked={off === v} onClick={() => changeOff(v)}
                className={`relative rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${ring} ${off === v ? 'text-white' : 'text-black/60 hover:text-black'}`}>
                {off === v && <motion.span layoutId="off" className="absolute inset-0 rounded-lg bg-[#0f5c52]" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                <span className="relative">{l}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.aside>
    </div>
  );
}