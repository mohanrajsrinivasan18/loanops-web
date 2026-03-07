import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/super-admin/tenants - List all tenants
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    
    if (!auth.user || auth.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { ownerPhone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Subscription: {
            where: { status: 'active' },
            include: {
              Plan: {
                select: {
                  name: true,
                  price: true
                }
              }
            }
          },
          Limits: true,
          _count: {
            select: {
              User: true,
              Customer: true,
              Loan: true,
              Agent: true,
              Line: true
            }
          }
        }
      }),
      prisma.tenant.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      tenants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Tenants list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/tenants - Create new tenant
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
      code,
      ownerName,
      ownerPhone,
      ownerEmail,
      planId,
      businessType = 'lending'
    } = body;

    // Validate required fields
    if (!name || !code || !ownerPhone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.tenant.findUnique({
      where: { code }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Tenant code already exists' },
        { status: 400 }
      );
    }

    // Create tenant with subscription and limits
    const tenant = await prisma.tenant.create({
      data: {
        name,
        code,
        ownerName,
        ownerPhone,
        ownerEmail,
        businessType,
        status: 'active',
        Subscription: planId ? {
          create: {
            planId,
            status: 'trial',
            startDate: new Date(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
          }
        } : undefined,
        Limits: {
          create: {
            maxUsers: 3,
            maxCustomers: 500,
            maxLoansPerMonth: 1000,
            storageLimit: 1024,
            apiCallsPerDay: 10000,
            smsCredits: 100,
            whatsappCredits: 0
          }
        },
        Products: {
          create: [
            { productType: 'LOAN', enabled: true },
            { productType: 'CHIT', enabled: true },
            { productType: 'GOLD_LOAN', enabled: false },
            { productType: 'PERSONAL_LOAN', enabled: false },
            { productType: 'INSURANCE', enabled: false },
            { productType: 'SAVINGS', enabled: false },
          ]
        }
      },
      include: {
        Subscription: {
          include: { Plan: true }
        },
        Limits: true,
        Products: true
      }
    });

    // Log action
    await prisma.platformAuditLog.create({
      data: {
        adminUserId: auth.user.id,
        tenantId: tenant.id,
        action: 'created_tenant',
        entity: 'tenant',
        entityId: tenant.id,
        changes: { name, code, ownerName, ownerPhone }
      }
    });

    return NextResponse.json({
      success: true,
      tenant
    });

  } catch (error) {
    console.error('Create tenant error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
