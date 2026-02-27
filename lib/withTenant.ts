import { NextRequest, NextResponse } from 'next/server';
import { setTenantContext } from './prisma';

/**
 * Extracts tenantId from the request and sets the DB session context for RLS.
 * 
 * Priority:
 * 1. Query param: ?tenantId=xxx
 * 2. Header: x-tenant-id
 * 3. Falls back to NEXT_PUBLIC_TENANT_ID env var
 * 
 * Usage in API routes:
 *   export async function GET(request: NextRequest) {
 *     const tenantId = await withTenant(request);
 *     if (!tenantId) return NextResponse.json({ error: 'Missing business ID' }, { status: 400 });
 *     // All prisma queries are now scoped to this business
 *     const customers = await prisma.customer.findMany();
 *   }
 */
export async function withTenant(request: NextRequest): Promise<string | null> {
  const tenantId =
    request.nextUrl.searchParams.get('tenantId') ||
    request.headers.get('x-tenant-id') ||
    process.env.NEXT_PUBLIC_TENANT_ID ||
    null;

  if (tenantId) {
    await setTenantContext(tenantId);
  }

  return tenantId;
}
