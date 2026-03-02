import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, phone } = body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
    const inferredPhone = normalizedEmail && !normalizedEmail.includes('@') ? normalizedEmail : '';
    const loginPhone = normalizedPhone || inferredPhone;
    const loginEmail = normalizedEmail.includes('@') ? normalizedEmail : '';

    console.log('Login attempt:', { email: loginEmail || loginPhone, password: '***' });

    if ((!loginEmail && !loginPhone) || !password) {

      const errResponse = NextResponse.json(
        { error: 'Email/Phone and password are required' },
        { status: 400 }
      );
      return addCorsHeaders(errResponse, request);
    }

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: loginEmail ? { email: loginEmail } : { phone: loginPhone },
      include: {
        Tenant: true,
      },
    });

    console.log('User found:', user ? { id: user.id, email: user.email, phone: user.phone, role: user.role } : 'Not found');

    if (!user) {
      // For development: provide helpful error message
      const allUsers = await prisma.user.findMany({
        select: { email: true, phone: true, role: true },
        take: 5,
      });
      console.log('Available users:', allUsers);


      const errResponse = NextResponse.json(
        {
          error: 'Invalid credentials',
          hint: 'Try: admin@loanops.com with password: admin123, or agent phone number',
          availableUsers: allUsers.map(u => u.email || u.phone),
        },
        { status: 401 }
      );
      return addCorsHeaders(errResponse, request);
    }

    // Verify password
    let isValidPassword = false;

    try {
      isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isValidPassword);
    } catch (error) {
      console.error('Password comparison error:', error);
    }

    // Development bypass: if password is 'admin123' and it fails bcrypt, 
    // check if stored password is plain text (for testing)
    if (!isValidPassword && password === 'admin123') {
      if (user.password === 'admin123') {
        console.log('⚠️ WARNING: Plain text password detected! Using for development only.');
        isValidPassword = true;
      } else {
        // Try rehashing and comparing
        const testHash = await bcrypt.hash('admin123', 10);
        console.log('Stored password hash:', user.password.substring(0, 20) + '...');
        console.log('Test hash:', testHash.substring(0, 20) + '...');
      }
    }

    if (!isValidPassword) {

      const errResponse = NextResponse.json(
        {
          error: 'Invalid credentials',
          hint: 'Password does not match. Try running: npm run db:reset in loanops-web folder',
        },
        { status: 401 }
      );
      return addCorsHeaders(errResponse, request);
    }

    // Generate a simple token (user ID + timestamp + random)
    // In production, use proper JWT or session management
    const token = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
        random: Math.random().toString(36),
      })
    ).toString('base64');

    console.log('Login successful for:', user.email);

    // If user is owner/admin and doesn't have a tenant, create one
    let tenant = user.Tenant;
    if ((user.role === 'admin' || user.role === 'super_admin') && !user.tenantId) {
      console.log('Creating tenant for owner:', user.email);

      const tenantName = user.name + "'s Business";
      const tenantCode = user.name.substring(0, 3).toUpperCase() + Date.now().toString().slice(-4);

      tenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          code: tenantCode,
          status: 'active',
          plan: 'professional',
        },
      });

      // Update user with tenantId
      await prisma.user.update({
        where: { id: user.id },
        data: { tenantId: tenant.id },
      });

      console.log('Tenant created:', tenant.id);
    }

    // NOTE: Shadow agents are NOT created automatically
    // They are only created when admin explicitly chooses to create one when adding an agent

    // Return user data and token
    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        agentId: user.agentId, // Include agentId for agent users
        tenantId: tenant?.id || user.tenantId,
        tenant: tenant || user.Tenant,
      },
    });

    return addCorsHeaders(response, request);
  } catch (error: any) {
    console.error('Login error:', error);

    const errResponse = NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    );
    return addCorsHeaders(errResponse, request);
  }
}



export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
