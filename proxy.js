import { NextResponse } from 'next/server';

const ALLOWED_METHODS = 'GET,POST,PUT,DELETE,OPTIONS';
const ALLOWED_HEADERS = 'Content-Type';

function allowedOrigins() {
  return [process.env.MY_DEV_URL, process.env.MY_PROD_URL]
    .filter(Boolean)
    .map(value => value.replace(/\/$/, ''));
}

function requestOrigin(request) {
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const referer = request.headers.get('referer');
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function proxy(request) {
  const origin = requestOrigin(request);
  const allowed = origin && allowedOrigins().includes(origin);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Request origin is not allowed' },
      { status: 403 },
    );
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': ALLOWED_HEADERS,
        'Access-Control-Allow-Methods': ALLOWED_METHODS,
        'Access-Control-Allow-Origin': origin,
        Vary: 'Origin',
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Vary', 'Origin');
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
