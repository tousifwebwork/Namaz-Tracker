import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import { User } from '@/lib/models';
import { setSession } from '@/lib/auth';
import { jsonBody, jsonError } from '@/lib/server';

export async function POST(request) {
  try {
    const { username, password } = await jsonBody(request);
    await connectDb();
    const user = await User.findOne({ username: String(username || '').trim().toLowerCase() }).select('+passwordHash');
    if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
    await setSession(user._id.toString());
    return NextResponse.json({ username: user.username });
  } catch (error) {
    return jsonError(error);
  }
}
