import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/super-admin/tenants/[id] - Get tenant details
export async function GET(
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

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        Subscription: {
          include: {
            Plan: true,
            Invoice: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        },
        Limits: true,
        Features: true,
        Usage: {
          orderBy: { date: 'desc' },
          take: 30
        },
        _count: {
          select: {
            User: true,
            Customer: true,
            Loan: true,
            Agent: true,
            Line: true,
            Collection: true
          }
        }
      }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tenant
    });

  } catch (error) {
    console.error('Get tenant error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}

// PATCH /api/super-admin/tenants/[id] - Update tenant
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
    const { status, name, ownerName, ownerPhone, ownerEmail } = body;

    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(name && { name }),
        ...(ownerName && { ownerName }),
        ...(ownerPhone && { ownerPhone }),
        ...(ownerEmail && { ownerEmail })
      }
    });

    // Log action
    await prisma.platformAuditLog.create({
      data: {
        adminUserId: auth.user.id,
        tenantId: tenant.id,
        action: 'updated_tenant',
        entity: 'tenant',
        entityId: tenant.id,
        changes: body
      }
    });

    return NextResponse.json({
      success: true,
      tenant
    });

  } catch (error) {
    console.error('Update tenant error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/tenants/[id] - Delete tenant (soft delete)
export async function DELETE(
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

    // Soft delete by setting status to inactive
    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data: { status: 'inactive' }
    });

    // Log action
    await prisma.platformAuditLog.create({
      data: {
        adminUserId: auth.user.id,
        tenantId: tenant.id,
        action: 'deleted_tenant',
        entity: 'tenant',
        entityId: tenant.id,
        changes: { status: 'inactive' }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Tenant deactivated successfully'
    });

  } catch (error) {
    console.error('Delete tenant error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}
