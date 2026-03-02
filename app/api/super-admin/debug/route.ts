import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Temporary debug endpoint - remove after fixing auth
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    let tokenData: any = null;
    let dbUser: any = null;

    if (token) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        tokenData = JSON.parse(decoded);
      } catch {
        tokenData = { error: 'Failed to decode token' };
      }

      if (tokenData?.userId) {
        dbUser = await prisma.user.findUnique({
          where: { id: tokenData.userId },
          select: { id: true, name: true, phone: true, role: true, status: true, tenantId: true },
        });
      }
    }

    // Also check if super admin exists at all
    const superAdmins = await prisma.user.findMany({
      where: { role: 'super_admin' },
      select: { id: true, name: true, phone: true, email: true, role: true, status: true },
    });

    return NextResponse.json({
      hasAuthHeader: !!authHeader,
      tokenPresent: !!token,
      tokenData,
      dbUser,
      superAdminsInDb: superAdmins,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
