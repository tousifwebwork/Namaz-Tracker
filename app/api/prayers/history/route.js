import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { Prayer } from '@/lib/models';
import { PRAYERS } from '@/lib/prayers';
import { jsonError } from '@/lib/server';

function validYear(value) {
  return /^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= 2100;
}

export async function GET(request) {
  try {
    const user = await requireUser();
    const year = new URL(request.url).searchParams.get('year') || String(new Date().getFullYear());
    if (!validYear(year)) {
      return NextResponse.json({ error: 'A valid year is required' }, { status: 400 });
    }

    const rows = await Prayer.find({
      userId: user._id,
      date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
    }).select(`date ${PRAYERS.join(' ')}`).lean();

    const days = Object.fromEntries(rows.map((row) => [
      row.date,
      PRAYERS.reduce((count, prayer) => count + (row[prayer] ? 1 : 0), 0),
    ]));

    return NextResponse.json({ year: Number(year), days });
  } catch (error) {
    return jsonError(error);
  }
}
