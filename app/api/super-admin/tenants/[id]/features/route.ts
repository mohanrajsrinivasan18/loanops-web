import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/super-admin/tenants/[id]/features - Get tenant features
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

    const features = await prisma.tenantFeature.findMany({
      where: { tenantId: params.id }
    });

    return NextResponse.json({
      success: true,
      features
    });

  } catch (error) {
    console.error('Get features error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/tenants/[id]/features - Toggle feature
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
    const { featureName, enabled } = body;

    if (!featureName || enabled === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upsert feature
    const feature = await prisma.tenantFeature.upsert({
      where: {
        tenantId_featureName: {
          tenantId: params.id,
          featureName
        }
      },
      update: { enabled },
      create: {
        tenantId: params.id,
        featureName,
        enabled
      }
    });

    // Log action
    await prisma.platformAuditLog.create({
      data: {
        adminUserId: auth.user.id,
        tenantId: params.id,
        action: 'toggled_feature',
        entity: 'tenant_feature',
        entityId: feature.id,
        changes: { featureName, enabled }
      }
    });

    return NextResponse.json({
      success: true,
      feature
    });

  } catch (error) {
    console.error('Toggle feature error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle feature' },
      { status: 500 }
    );
  }
}
