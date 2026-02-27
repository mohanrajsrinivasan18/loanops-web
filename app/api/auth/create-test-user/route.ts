import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';
import bcrypt from 'bcryptjs';

/**
 * Development endpoint to create/update test user
 * DELETE THIS IN PRODUCTION!
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return addCorsHeaders(NextResponse.json(
        { error: 'Not available in production' },
        { status: 403 }
      ));
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Creating test user with hashed password...');

    // Try to update existing user or create new one
    const user = await prisma.user.upsert({
      where: { email: 'admin@loanops.com' },
      update: {
        password: hashedPassword,
        name: 'Super Admin',
        role: 'super_admin',
        status: 'active',
      },
      create: {
        email: 'admin@loanops.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'super_admin',
        status: 'active',
      },
    });

    console.log('Test user created/updated:', user.email);

    return addCorsHeaders(NextResponse.json({
      success: true,
      message: 'Test user created/updated successfully',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
      credentials: {
        email: 'admin@loanops.com',
        password: 'admin123',
      },
    }));
  } catch (error: any) {
    console.error('Error creating test user:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to create test user', details: error.message },
      { status: 500 }
    ));
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
