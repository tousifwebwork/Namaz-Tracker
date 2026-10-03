import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { Prayer } from '@/lib/models';
import { PRAYERS, dateRange, statsFor } from '@/lib/prayers';
import { jsonBody, jsonError, validDate } from '@/lib/server';

export async function POST(request) {
  try {
    const user = await requireUser();
    const { date, scope, done } = await jsonBody(request);
    if (!validDate(date) || !['day', 'month', 'year'].includes(scope) || typeof done !== 'boolean') {
      return NextResponse.json({ error: 'Invalid bulk update' }, { status: 400 });
    }
    const dates = dateRange(date, scope);
    const update = Object.fromEntries(PRAYERS.map(key => [key, done]));
    await Prayer.bulkWrite(dates.map(value => ({
      updateOne: { filter: { userId: user._id, date: value }, update: { $set: update }, upsert: true },
    })));
    return NextResponse.json({ stats: await statsFor(user._id, date) });
  } catch (error) {
    return jsonError(error);
  }
}
