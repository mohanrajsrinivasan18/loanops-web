import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/super-admin/tenants/[id]/limits - Update tenant limits
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request);
    
    if (!auth.user || auth.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      maxUsers,
      maxCustomers,
      maxLoansPerMonth,
      storageLimit,
      apiCallsPerDay,
      smsCredits,
      whatsappCredits
    } = body;

    // Check if limits exist
    const existing = await prisma.tenantLimit.findUnique({
      where: { tenantId: params.id }
    });

    let limits;
    if (existing) {
      limits = await prisma.tenantLimit.update({
        where: { tenantId: params.id },
        data: {
          ...(maxUsers !== undefined && { maxUsers }),
          ...(maxCustomers !== undefined && { maxCustomers }),
          ...(maxLoansPerMonth !== undefined && { maxLoansPerMonth }),
          ...(storageLimit !== undefined && { storageLimit }),
          ...(apiCallsPerDay !== undefined && { apiCallsPerDay }),
          ...(smsCredits !== undefined && { smsCredits }),
          ...(whatsappCredits !== undefined && { whatsappCredits })
        }
      });
    } else {
      limits = await prisma.tenantLimit.create({
        data: {
          tenantId: params.id,
          maxUsers: maxUsers || 3,
          maxCustomers: maxCustomers || 500,
          maxLoansPerMonth: maxLoansPerMonth || 1000,
          storageLimit: storageLimit || 1024,
          apiCallsPerDay: apiCallsPerDay || 10000,
          smsCredits: smsCredits || 100,
          whatsappCredits: whatsappCredits || 0
        }
      });
    }

    // Log action
    await prisma.platformAuditLog.create({
      data: {
        adminUserId: auth.user.id,
        tenantId: params.id,
        action: 'updated_limits',
        entity: 'tenant_limit',
        entityId: limits.id,
        changes: body
      }
    });

    return NextResponse.json({
      success: true,
      limits
    });

  } catch (error) {
    console.error('Update limits error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update limits' },
      { status: 500 }
    );
  }
}
