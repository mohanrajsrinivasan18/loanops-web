import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

/**
 * GET /api/admin/setup-super-admin
 * Check if super admin exists and show details
 * 
 * POST /api/admin/setup-super-admin
 * Create or update super admin with phone number
 * Body: { action: 'create' | 'update', phone?: string }
 */

export async function GET(request: NextRequest) {
  try {
    const superAdmins = await prisma.user.findMany({
      where: { role: 'super_admin' },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        count: superAdmins.length,
        superAdmins: superAdmins.map(admin => ({
          ...admin,
          hasPhone: !!admin.phone,
        })),
      }),
      request
    );
  } catch (error: any) {
    console.error('Error checking super admin:', error);
    return addCorsHeaders(
      NextResponse.json({
        success: false,
        error: 'Failed to check super admin',
        details: error.message,
      }, { status: 500 }),
      request
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone } = body;

    if (action === 'create') {
      // Check if super admin already exists
      const existing = await prisma.user.findFirst({
        where: { role: 'super_admin' },
      });

      if (existing) {
        return addCorsHeaders(
          NextResponse.json({
            success: false,
            error: 'Super admin already exists',
            superAdmin: {
              id: existing.id,
              email: existing.email,
              phone: existing.phone,
              name: existing.name,
            },
          }, { status: 409 }),
          request
        );
      }

      // Create new super admin
      const superAdmin = await prisma.user.create({
        data: {
          email: 'superadmin@loanops.com',
          phone: phone || '9999999999',
          name: 'Super Admin',
          password: await bcrypt.hash('super123', 10),
          role: 'super_admin',
          status: 'active',
        },
      });

      return addCorsHeaders(
        NextResponse.json({
          success: true,
          message: 'Super admin created successfully',
          superAdmin: {
            id: superAdmin.id,
            email: superAdmin.email,
            phone: superAdmin.phone,
            name: superAdmin.name,
          },
          credentials: {
            email: 'superadmin@loanops.com',
            phone: phone || '9999999999',
            password: 'super123',
          },
        }),
        request
      );
    }

    if (action === 'update') {
      // Find super admin
      const superAdmin = await prisma.user.findFirst({
        where: { role: 'super_admin' },
      });

      if (!superAdmin) {
        return addCorsHeaders(
          NextResponse.json({
            success: false,
            error: 'Super admin not found. Use action: "create" to create one.',
          }, { status: 404 }),
          request
        );
      }

      // Update phone number
      const updated = await prisma.user.update({
        where: { id: superAdmin.id },
        data: { phone: phone || '9999999999' },
      });

      return addCorsHeaders(
        NextResponse.json({
          success: true,
          message: 'Super admin updated successfully',
          superAdmin: {
            id: updated.id,
            email: updated.email,
            phone: updated.phone,
            name: updated.name,
          },
        }),
        request
      );
    }

    return addCorsHeaders(
      NextResponse.json({
        success: false,
        error: 'Invalid action. Use "create" or "update"',
      }, { status: 400 }),
      request
    );
  } catch (error: any) {
    console.error('Error setting up super admin:', error);
    return addCorsHeaders(
      NextResponse.json({
        success: false,
        error: 'Failed to setup super admin',
        details: error.message,
      }, { status: 500 }),
      request
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
