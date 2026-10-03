import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { User, Prayer } from '@/lib/models';
import { PRAYERS } from '@/lib/prayers';
import { jsonBody, jsonError, validDate } from '@/lib/server';

function statistics(user, rows) {
  if (!user.dob) return null;
  const dob = new Date(user.dob);
  const age12 = new Date(Date.UTC(dob.getUTCFullYear() + 12, dob.getUTCMonth(), dob.getUTCDate()));
  const start = age12.toISOString().slice(0, 10);
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const days = Math.max(0, Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - age12.getTime()) / 86400000) + 1);
  const byPrayer = Object.fromEntries(PRAYERS.map(key => [key, { required: days, offered: rows.reduce((n, row) => n + (row[key] ? 1 : 0), 0) }]));
  const offered = Object.values(byPrayer).reduce((n, item) => n + item.offered, 0);
  const required = days * PRAYERS.length;
  return { required, offered, remaining: Math.max(0, required - offered), percent: required ? (offered / required) * 100 : 0, byPrayer, age12Date: start, rangeEnd: end };
}

export async function GET() {
  try {
    const user = await requireUser();
    const rows = user.dob ? await Prayer.find({ userId: user._id, date: { $gte: new Date(new Date(user.dob).setUTCFullYear(new Date(user.dob).getUTCFullYear() + 12)).toISOString().slice(0, 10) } }).lean() : [];
    const stats = statistics(user, rows);
    return NextResponse.json({ username: user.username, dob: user.dob, ...(stats ? { ...stats, stats } : {}) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request) {
  try {
    const user = await requireUser();
    const { dob } = await jsonBody(request);
    if (!validDate(dob) || new Date(`${dob}T00:00:00Z`) > new Date()) {
      return NextResponse.json({ error: 'A valid date of birth is required' }, { status: 400 });
    }
    await User.updateOne({ _id: user._id }, { $set: { dob: new Date(`${dob}T00:00:00Z`) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
