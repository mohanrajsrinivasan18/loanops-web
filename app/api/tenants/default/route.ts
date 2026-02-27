import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function GET() {
  try {
    // Get the first active tenant (usually Mumbai for demo)
    const tenant = await prisma.tenant.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' },
    });
    
    if (!tenant) {
      return addCorsHeaders(NextResponse.json({ error: 'No active tenant found' }, { status: 404 }));
    }
    
    return addCorsHeaders(NextResponse.json(tenant));
  } catch (error: any) {
    console.error('Error fetching default tenant:', error);
    return addCorsHeaders(NextResponse.json({
      error: 'Failed to fetch default tenant',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
