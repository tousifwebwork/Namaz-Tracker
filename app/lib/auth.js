import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { User } from './models';
import { connectDb } from './db';

const COOKIE = 'namaz_session';
const TOKEN_EXPIRY = '10d';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 10;

function secret() {
  if (!process.env.AUTH_SECRET) throw new Error('AUTH_SECRET is not configured');
  return process.env.AUTH_SECRET;
}

function sign(userId) {
  return jwt.sign({ userId }, secret(), { expiresIn: TOKEN_EXPIRY });
}

function verify(value) {
  if (!value) return null;
  try {
    const payload = jwt.verify(value, secret());
    return typeof payload === 'object' && typeof payload.userId === 'string' ? payload.userId : null;
  } catch {
    return null;
  }
}

export async function setSession(userId) {
  const store = await cookies();
  store.set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
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
