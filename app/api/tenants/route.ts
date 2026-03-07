import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const ownerEmail = request.nextUrl.searchParams.get('ownerEmail');

    if (id) {
      const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
          Agent: true,
          Customer: true,
          Loan: true,
        },
      });

      if (!tenant) {
        return addCorsHeaders(NextResponse.json({ 
          success: false,
          error: 'Tenant not found' 
        }, { status: 404 }));
      }

      return addCorsHeaders(NextResponse.json({
        success: true,
        data: tenant,
      }));
    }

    // Get tenant by owner email
    if (ownerEmail) {
      const tenant = await prisma.tenant.findFirst({
        where: {
          User: {
            some: {
              email: ownerEmail,
              role: { in: ['admin', 'super_admin'] },
            },
          },
        },
        include: {
          Agent: { where: { status: 'active' } },
          Customer: { where: { status: 'active' } },
        },
      });

      if (!tenant) {
        return addCorsHeaders(NextResponse.json({
          success: false,
          error: 'No tenant found for this owner',
        }, { status: 404 }));
      }

      return addCorsHeaders(NextResponse.json({
        success: true,
        data: tenant,
      }));
    }

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      include: {
        Agent: { where: { status: 'active' } },
        Customer: { where: { status: 'active' } },
      },
    });

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: tenants,
    }));
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return addCorsHeaders(NextResponse.json({ 
      success: false,
      error: 'Failed to fetch tenants',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('=== CREATE TENANT API ===');
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { name, code, ownerEmail, ownerPhone, plan } = body;

    // Validate required fields
    if (!name) {
      return addCorsHeaders(NextResponse.json({ 
        success: false,
        error: 'Tenant name is required' 
      }, { status: 400 }));
    }

    // Generate code if not provided
    const tenantCode = code || name.substring(0, 3).toUpperCase() + Date.now().toString().slice(-4);

    // Check if tenant already exists for this owner
    if (ownerEmail) {
      const existingTenant = await prisma.tenant.findFirst({
        where: {
          User: {
            some: {
              email: ownerEmail,
            },
          },
        },
      });

      if (existingTenant) {
        return addCorsHeaders(NextResponse.json({
          success: true,
          data: existingTenant,
          message: 'Tenant already exists for this owner',
        }));
      }
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        code: tenantCode,
        status: 'active',
        plan: plan || 'professional',
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
    });

    console.log('Tenant created successfully:', tenant.id);
    return addCorsHeaders(NextResponse.json({
      success: true,
      data: tenant,
    }));
  } catch (error: any) {
    console.error('=== CREATE TENANT ERROR ===');
    console.error('Error:', error);
    return addCorsHeaders(NextResponse.json({
      success: false,
      error: 'Failed to create tenant',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return addCorsHeaders(NextResponse.json({ 
        success: false,
        error: 'Tenant ID required' 
      }, { status: 400 }));
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: updates,
    });

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: tenant,
    }));
  } catch (error: any) {
    console.error('Error updating tenant:', error);
    return addCorsHeaders(NextResponse.json({
      success: false,
      error: 'Failed to update tenant',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
