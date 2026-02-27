import { NextResponse } from 'next/server';

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:8082',  // Expo dev server
  'http://localhost:8083',  // Expo web
  'http://localhost:19006', // Expo web alternative
  'http://localhost:19000', // Expo dev tools
  'http://localhost:3000',  // Next.js dev
  'exp://localhost:8081',   // Expo Go
];

/**
 * Add CORS headers to a NextResponse
 * @param response - The NextResponse object
 * @param origin - The request origin
 * @returns The response with CORS headers added
 */
export function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return response;
}

/**
 * Create a JSON response with CORS headers
 * @param data - The response data
 * @param options - Response options (status, headers, etc.)
 * @param origin - The request origin
 * @returns NextResponse with CORS headers
 */
export function corsJsonResponse(
  data: any,
  options: { status?: number; headers?: HeadersInit } = {},
  origin: string | null = null
): NextResponse {
  const response = NextResponse.json(data, options);
  return addCorsHeaders(response, origin);
}

/**
 * Handle OPTIONS preflight request
 * @param origin - The request origin
 * @returns NextResponse for preflight
 */
export function handlePreflight(origin: string | null): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}
