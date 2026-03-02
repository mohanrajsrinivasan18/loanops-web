import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/super-admin/plans - List all plans
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    
    if (!auth.user || auth.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            TenantSubscription: {
              where: { status: 'active' }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      plans
    });

  } catch (error) {
    console.error('Plans list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/plans - Create new plan
export async function POST(request: NextRequest) {
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
      sortOrder = 0
    } = body;

    if (!name || price === undefined || !billingCycle) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        price,
        billingCycle,
        features: features || {},
        limits: limits || {},
        sortOrder,
        isActive: true
      }
    });

    // Log action
    await prisma.platformAuditLog.create({
      data: {
        adminUserId: auth.user.id,
        action: 'created_plan',
        entity: 'subscription_plan',
        entityId: plan.id,
        changes: { name, price, billingCycle }
      }
    });

    return NextResponse.json({
      success: true,
      plan
    });

  } catch (error) {
    console.error('Create plan error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
