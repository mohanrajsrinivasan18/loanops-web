import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/super-admin/tenants/[id]/subscription - Assign/Update subscription
export async function POST(
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
    const { planId, status, startDate, endDate, autoRenew } = body;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Check if tenant has active subscription
    const existingSubscription = await prisma.tenantSubscription.findFirst({
      where: {
        tenantId: params.id,
        status: 'active'
      }
    });

    let subscription;

    if (existingSubscription) {
      // Update existing subscription
      subscription = await prisma.tenantSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          planId,
          status: status || 'active',
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(autoRenew !== undefined && { autoRenew })
        },
        include: { Plan: true }
      });
    } else {
      // Create new subscription
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : null;

      subscription = await prisma.tenantSubscription.create({
        data: {
          tenantId: params.id,
          planId,
          status: status || 'active',
          startDate: start,
          endDate: end,
          autoRenew: autoRenew !== undefined ? autoRenew : true
        },
        include: { Plan: true }
      });
    }

    // Update tenant limits based on plan
    const planLimits = plan.limits as any;
    await prisma.tenantLimit.upsert({
      where: { tenantId: params.id },
      update: {
        maxUsers: planLimits.maxUsers || 3,
        maxCustomers: planLimits.maxCustomers || 500,
        maxLoansPerMonth: planLimits.maxLoansPerMonth || 1000,
        storageLimit: planLimits.storageLimit || 1024,
        apiCallsPerDay: planLimits.apiCallsPerDay || 10000,
        smsCredits: planLimits.smsCredits || 100,
        whatsappCredits: planLimits.whatsappCredits || 0
      },
      create: {
        tenantId: params.id,
        maxUsers: planLimits.maxUsers || 3,
        maxCustomers: planLimits.maxCustomers || 500,
        maxLoansPerMonth: planLimits.maxLoansPerMonth || 1000,
        storageLimit: planLimits.storageLimit || 1024,
        apiCallsPerDay: planLimits.apiCallsPerDay || 10000,
        smsCredits: planLimits.smsCredits || 100,
        whatsappCredits: planLimits.whatsappCredits || 0
      }
    });

    // Enable features based on plan
    const planFeatures = plan.features as any;
    for (const [featureName, enabled] of Object.entries(planFeatures)) {
      await prisma.tenantFeature.upsert({
        where: {
          tenantId_featureName: {
            tenantId: params.id,
            featureName
          }
        },
        update: { enabled: !!enabled },
        create: {
          tenantId: params.id,
          featureName,
          enabled: !!enabled
        }
      });
    }

    // Log action
    await prisma.platformAuditLog.create({
      data: {
        adminUserId: auth.user.id,
        tenantId: params.id,
        action: existingSubscription ? 'updated_subscription' : 'created_subscription',
        entity: 'tenant_subscription',
        entityId: subscription.id,
        changes: { planId, planName: plan.name, status }
      }
    });

    return NextResponse.json({
      success: true,
      subscription
    });

  } catch (error) {
    console.error('Subscription assignment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign subscription' },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/tenants/[id]/subscription - Cancel subscription
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

    // Find active subscription
    const subscription = await prisma.tenantSubscription.findFirst({
      where: {
        tenantId: params.id,
        status: 'active'
      }
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel subscription
    const updated = await prisma.tenantSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'cancelled',
        endDate: new Date()
      }
    });

    // Log action
    await prisma.platformAuditLog.create({
      data: {
        adminUserId: auth.user.id,
        tenantId: params.id,
        action: 'cancelled_subscription',
        entity: 'tenant_subscription',
        entityId: subscription.id,
        changes: { status: 'cancelled' }
      }
    });

    return NextResponse.json({
      success: true,
      subscription: updated
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
