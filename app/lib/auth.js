import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { User } from './models';
import { connectDb } from './db';

const COOKIE = 'namaz_session';
const secret = () => process.env.AUTH_SECRET || (process.env.NODE_ENV === 'development' ? 'development-only-secret-change-me' : null);

function sign(value) {
  const key = secret();
  if (!key) throw new Error('AUTH_SECRET is not configured');
  return crypto.createHmac('sha256', key).update(value).digest('hex');
}

function token(userId) {
  const value = `${userId}.${Date.now() + 1000 * 60 * 60 * 24 * 30}`;
  return `${value}.${sign(value)}`;
}

function verify(value) {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 3 || Number(parts[1]) < Date.now()) return null;
  const expected = sign(`${parts[0]}.${parts[1]}`);
  const provided = Buffer.from(parts[2]);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length || !crypto.timingSafeEqual(provided, expectedBuffer)) return null;
  return parts[0];
}

export async function setSession(userId) {
  const store = await cookies();
  store.set(COOKIE, token(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function requireUser() {
  await connectDb();
  const store = await cookies();
  const id = verify(store.get(COOKIE)?.value);
  if (!id) throw new Error('UNAUTHORIZED');
  const user = await User.findById(id).lean();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}
