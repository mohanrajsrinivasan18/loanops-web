import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_ALLOWED_ORIGINS = new Set<string>([
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:8083',
  'http://localhost:19006',
  'http://localhost:19000',
  'exp://localhost:8081',
]);

const ENV_ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Add the app URL if set (covers Vercel deployment URL)
if (process.env.NEXT_PUBLIC_APP_URL) {
  ENV_ALLOWED_ORIGINS.push(process.env.NEXT_PUBLIC_APP_URL);
}

const ALLOWED_ORIGINS = new Set<string>([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...ENV_ALLOWED_ORIGINS,
]);

type CorsRequestLike = NextRequest | Request | string | null | undefined;

function extractOrigin(req?: CorsRequestLike): string | null {
  if (!req) return null;
  if (typeof req === 'string') return req;
  if ('headers' in req) return req.headers.get('origin');
  return null;
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Allow any Vercel preview/production URL for this app
  if (origin.endsWith('.vercel.app')) return true;
  return false;
}

function setBaseCorsHeaders(response: NextResponse) {
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Version'
  );
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
}

/**
 * Add CORS headers to any NextResponse.
 * Pass request/origin when possible so ACAO can be explicit.
 */
export function addCorsHeaders(
  response: NextResponse,
  req?: CorsRequestLike
): NextResponse {
  const origin = extractOrigin(req);
  const allowExplicitOrigin = isAllowedOrigin(origin);
  const existingOrigin = response.headers.get('Access-Control-Allow-Origin');

  // Prevent duplicate ACAO values like "http://localhost:8081, *".
  response.headers.delete('Access-Control-Allow-Origin');

  if (allowExplicitOrigin && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  } else if (existingOrigin && existingOrigin !== '*') {
    // Preserve an explicit origin if already set by another layer.
    response.headers.set('Access-Control-Allow-Origin', existingOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  } else {
    // Fallback for non-browser callers and same-origin tooling.
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.delete('Access-Control-Allow-Credentials');
  }

  setBaseCorsHeaders(response);
  return response;
}

/**
 * Create a JSON response with CORS headers.
 */
export function corsJson(
  data: any,
  init?: ResponseInit,
  req?: CorsRequestLike
): NextResponse {
  const response = NextResponse.json(data, init);
  return addCorsHeaders(response, req);
}

/**
 * Handle OPTIONS preflight request.
 */
export function corsOptions(req?: CorsRequestLike): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response, req);
}
