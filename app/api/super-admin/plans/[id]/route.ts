import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/super-admin/plans/[id] - Update plan
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
      name,
      description,
      price,
      billingCycle,
      features,
      limits,
      isActive,
      sortOrder
    } = body;

    const plan = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(billingCycle && { billingCycle }),
        ...(features && { features }),
        ...(limits && { limits }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder })
      }
    });

    // Log action
    await prisma.platformAuditLog.create({
      data: {
        adminUserId: auth.user.id,
        action: 'updated_plan',
        entity: 'subscription_plan',
        entityId: plan.id,
        changes: body
      }
    });

    return NextResponse.json({
      success: true,
      plan
    });

  } catch (error) {
    console.error('Update plan error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/plans/[id] - Deactivate plan
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

    // Check if plan has active subscriptions
    const activeSubscriptions = await prisma.tenantSubscription.count({
      where: {
        planId: params.id,
        status: 'active'
      }
    });

    if (activeSubscriptions > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete plan with ${activeSubscriptions} active subscriptions` },
        { status: 400 }
      );
    }

    // Soft delete by deactivating
    const plan = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    // Log action
    await prisma.platformAuditLog.create({
      data: {
        adminUserId: auth.user.id,
        action: 'deleted_plan',
        entity: 'subscription_plan',
        entityId: plan.id,
        changes: { isActive: false }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Plan deactivated successfully'
    });

  } catch (error) {
    console.error('Delete plan error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
