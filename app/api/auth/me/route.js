import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { jsonError } from '@/lib/server';

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ username: user.username });
  } catch (error) {
    return jsonError(error);
  }
}
