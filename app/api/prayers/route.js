import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { Prayer } from '@/lib/models';
import { PRAYERS, statsFor } from '@/lib/prayers';
import { connectDb } from '@/lib/db';
import { jsonBody, jsonError, validDate } from '@/lib/server';

export async function GET(request) {
  try {
    const user = await requireUser();
    const date = new URL(request.url).searchParams.get('date');
    if (!validDate(date)) return NextResponse.json({ error: 'A valid date is required' }, { status: 400 });
    const row = await Prayer.findOne({ userId: user._id, date }).lean();
    return NextResponse.json({ day: Object.fromEntries(PRAYERS.map(key => [key, Boolean(row?.[key])])), stats: await statsFor(user._id, date) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireUser();
    const { date, prayer, done } = await jsonBody(request);
    if (!validDate(date) || !PRAYERS.includes(prayer) || typeof done !== 'boolean') {
      return NextResponse.json({ error: 'Invalid prayer update' }, { status: 400 });
    }
    await Prayer.findOneAndUpdate({ userId: user._id, date }, { $set: { [prayer]: done } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return NextResponse.json({ stats: await statsFor(user._id, date) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    await connectDb();
    await Prayer.deleteMany({ userId: user._id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
