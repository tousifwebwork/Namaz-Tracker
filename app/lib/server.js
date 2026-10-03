import { NextResponse } from 'next/server';

export function jsonError(error) {
  if (error?.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Please log in' }, { status: 401 });
  if (error?.message === 'MONGODB_URI is not configured') return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });
  console.error(error);
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}

export function jsonBody(request) {
  return request.json().catch(() => {
    throw new Error('Invalid JSON body');
  });
}

export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}
