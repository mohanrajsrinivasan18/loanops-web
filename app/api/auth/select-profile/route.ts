import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/select-profile
 * Called after OTP verification when user picks a profile or creates a new business.
 *
 * Body for existing profile: { phone, profileIndex, token }
 * Body for new business:     { phone, token, action: "create_business", name, businessName, businessCode }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, token, action } = body;

    if (!phone || !token) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Phone and token required' }, { status: 400 }),
        request
      );
    }

    const cleanPhone = phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');

    // Verify the OTP was verified for this phone
    const verifiedOtp = await prisma.otp.findFirst({
      where: { phone: cleanPhone, verified: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!verifiedOtp) {
      return addCorsHeaders(
        NextResponse.json({ error: 'OTP not verified. Please verify OTP first.' }, { status: 401 }),
        request
      );
    }

    // Clean up verified OTP (one-time use)
    await prisma.otp.delete({ where: { id: verifiedOtp.id } });

    // === CREATE NEW BUSINESS ===
    if (action === 'create_business') {
      const { name, businessName, businessCode } = body;

      if (!name || !businessName) {
        return addCorsHeaders(
          NextResponse.json({ error: 'Name and business name required' }, { status: 400 }),
          request
        );
      }

      const code = businessCode || businessName.substring(0, 4).toUpperCase() + Date.now().toString().slice(-4);

      // Check code uniqueness
      const existing = await prisma.tenant.findUnique({ where: { code } });
      if (existing) {
        return addCorsHeaders(
          NextResponse.json({ error: 'Business code already taken' }, { status: 409 }),
          request
        );
      }

      // Create tenant + admin user in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: businessName,
            code,
            ownerName: name,
            ownerPhone: cleanPhone,
            status: 'active',
            plan: 'starter',
          },
        });

        await tx.tenantSettings.create({
          data: { tenantId: tenant.id },
        });

        const hashedPassword = await bcrypt.hash(cleanPhone, 10);

        const user = await tx.user.create({
          data: {
            name,
            email: `${cleanPhone}@phone.local`,
            phone: cleanPhone,
            password: hashedPassword,
            role: 'admin',
            tenantId: tenant.id,
          },
        });

        return { tenant, user };
      });

      const newToken = Buffer.from(
        JSON.stringify({ userId: result.user.id, timestamp: Date.now(), random: Math.random().toString(36) })
      ).toString('base64');

      return addCorsHeaders(
        NextResponse.json({
          success: true,
          action: 'business_created',
          token: newToken,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            phone: cleanPhone,
            role: 'admin',
            tenantId: result.tenant.id,
            tenant: { id: result.tenant.id, name: result.tenant.name, code: result.tenant.code },
          },
        }),
        request
      );
    }

    // === SELECT EXISTING PROFILE ===
    const { profileIndex, agentId } = body;

    // If agentId provided, find/create user for that agent
    if (agentId) {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: { Tenant: true, User: true },
      });

      if (!agent) {
        return addCorsHeaders(
          NextResponse.json({ error: 'Agent not found' }, { status: 404 }),
          request
        );
      }

      let user = agent.User;

      // Create User record for agent if doesn't exist
      if (!user) {
        const hashedPassword = await bcrypt.hash(cleanPhone, 10);
        user = await prisma.user.create({
          data: {
            name: agent.name,
            email: `agent_${agent.id}@phone.local`,
            phone: cleanPhone,
            password: hashedPassword,
            role: 'agent',
            tenantId: agent.tenantId,
            agentId: agent.id,
          },
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const agentToken = Buffer.from(
        JSON.stringify({ userId: user.id, timestamp: Date.now(), random: Math.random().toString(36) })
      ).toString('base64');

      return addCorsHeaders(
        NextResponse.json({
          success: true,
          action: 'logged_in',
          token: agentToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: cleanPhone,
            role: 'agent',
            agentId: agent.id,
            tenantId: agent.tenantId,
            tenant: { id: agent.Tenant.id, name: agent.Tenant.name, code: agent.Tenant.code },
          },
        }),
        request
      );
    }

    // Select by profileIndex (for admin/owner profiles)
    if (profileIndex !== undefined && profileIndex !== null) {
      // Re-build profiles to find the selected one
      const users = await prisma.user.findMany({
        where: { OR: [{ phone: cleanPhone }, { email: cleanPhone }] },
        include: { Tenant: true },
      });

      const allProfiles: any[] = [];
      for (const u of users) {
        allProfiles.push({
          userId: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          agentId: u.agentId,
          tenantId: u.tenantId,
          tenant: u.Tenant ? { id: u.Tenant.id, name: u.Tenant.name, code: u.Tenant.code } : null,
        });
      }

      const agents = await prisma.agent.findMany({
        where: { phone: cleanPhone, status: 'active' },
        include: { Tenant: true, User: true },
      });
      for (const agent of agents) {
        if (agent.User && allProfiles.some((p) => p.userId === agent.User!.id)) continue;
        allProfiles.push({
          userId: agent.User?.id || null,
          name: agent.name,
          role: 'agent',
          agentId: agent.id,
          tenantId: agent.tenantId,
          tenant: { id: agent.Tenant.id, name: agent.Tenant.name, code: agent.Tenant.code },
        });
      }

      const selected = allProfiles[profileIndex];
      if (!selected) {
        return addCorsHeaders(
          NextResponse.json({ error: 'Invalid profile index' }, { status: 400 }),
          request
        );
      }

      // If it's an agent without a user, redirect to agentId flow
      if (selected.agentId && !selected.userId) {
        // Recursively handle via agent path above — but simpler to just handle inline
        const hashedPassword = await bcrypt.hash(cleanPhone, 10);
        const newUser = await prisma.user.create({
          data: {
            name: selected.name,
            email: `agent_${selected.agentId}@phone.local`,
            phone: cleanPhone,
            password: hashedPassword,
            role: 'agent',
            tenantId: selected.tenantId,
            agentId: selected.agentId,
          },
        });
        selected.userId = newUser.id;
      }

      await prisma.user.update({
        where: { id: selected.userId },
        data: { lastLoginAt: new Date() },
      });

      const profileToken = Buffer.from(
        JSON.stringify({ userId: selected.userId, timestamp: Date.now(), random: Math.random().toString(36) })
      ).toString('base64');

      return addCorsHeaders(
        NextResponse.json({
          success: true,
          action: 'logged_in',
          token: profileToken,
          user: {
            id: selected.userId,
            name: selected.name,
            email: selected.email,
            phone: cleanPhone,
            role: selected.role,
            agentId: selected.agentId,
            tenantId: selected.tenantId,
            tenant: selected.tenant,
          },
        }),
        request
      );
    }

    return addCorsHeaders(
      NextResponse.json({ error: 'Provide profileIndex or agentId or action' }, { status: 400 }),
      request
    );
  } catch (error: any) {
    console.error('Select profile error:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Profile selection failed', details: error.message }, { status: 500 }),
      request
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
