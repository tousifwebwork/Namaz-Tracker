import { Prayer } from './models';

export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export function ranges(date) {
  const day = new Date(`${date}T00:00:00Z`);
  const month = date.slice(0, 7);
  const year = date.slice(0, 4);
  return {
    day: [date, date],
    month: [`${month}-01`, `${month}-31`],
    year: [`${year}-01-01`, `${year}-12-31`],
  };
}

export async function statsFor(userId, date) {
  const r = ranges(date);
  const [day, month, year] = await Promise.all([
    Prayer.findOne({ userId, date }).lean(),
    Prayer.find({ userId, date: { $gte: r.month[0], $lte: r.month[1] } }).lean(),
    Prayer.find({ userId, date: { $gte: r.year[0], $lte: r.year[1] } }).lean(),
  ]);
  const count = rows => rows.reduce((total, row) => total + PRAYERS.filter(key => row[key]).length, 0);
  return { today: day ? count([day]) : 0, month: count(month), year: count(year) };
}

export function dateRange(date, scope) {
  const start = new Date(`${date}T00:00:00Z`);
  let end = new Date(start);
  if (scope === 'month') end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  if (scope === 'year') end = new Date(Date.UTC(start.getUTCFullYear(), 11, 31));
  const dates = [];
  for (let current = start; current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
    dates.push(current.toISOString().slice(0, 10));
  }
  return dates;
}
