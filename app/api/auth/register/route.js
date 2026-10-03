import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import { User } from '@/lib/models';
import { setSession } from '@/lib/auth';
import { jsonBody, jsonError } from '@/lib/server';

export async function POST(request) {
  try {
    const { username, password } = await jsonBody(request);
    const name = String(username || '').trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(name) || typeof password !== 'string' || password.length < 6 || password.length > 128) {
      return NextResponse.json({ error: 'Use a username of 3-30 letters, numbers, or underscores and a 6-128 character password' }, { status: 400 });
    }
    await connectDb();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username: name, passwordHash });
    await setSession(user._id.toString());
    return NextResponse.json({ username: user.username }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) return NextResponse.json({ error: 'That username is already registered' }, { status: 409 });
    return jsonError(error);
  }
}
