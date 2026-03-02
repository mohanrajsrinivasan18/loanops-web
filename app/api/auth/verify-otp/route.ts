import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 }),
        request
      );
    }

    const cleanPhone = phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');

    // Find valid OTP
    const otpRecord = await prisma.otp.findFirst({
      where: {
        phone: cleanPhone,
        code: otp,
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      // Increment attempts on latest OTP
      const latest = await prisma.otp.findFirst({
        where: { phone: cleanPhone },
        orderBy: { createdAt: 'desc' },
      });
      if (latest) {
        await prisma.otp.update({
          where: { id: latest.id },
          data: { attempts: { increment: 1 } },
        });
        if (latest.attempts >= 4) {
          await prisma.otp.delete({ where: { id: latest.id } });
          return addCorsHeaders(
            NextResponse.json({ error: 'Too many attempts. Request a new OTP.' }, { status: 429 }),
            request
          );
        }
      }
      return addCorsHeaders(
        NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 }),
        request
      );
    }

    // Mark OTP as verified
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Find ALL profiles linked to this phone number
    // A phone can be: admin (owner), agent, or customer across multiple businesses
    const profiles = await buildProfiles(cleanPhone);

    // Generate token
    const token = Buffer.from(
      JSON.stringify({ phone: cleanPhone, timestamp: Date.now(), random: Math.random().toString(36) })
    ).toString('base64');

    // If exactly one profile, auto-login
    if (profiles.length === 1) {
      const profile = profiles[0];
      await prisma.user.update({
        where: { id: profile.userId },
        data: { lastLoginAt: new Date() },
      });

      // Clean up OTP since we're auto-logging in (no select-profile call)
      await prisma.otp.delete({ where: { id: otpRecord.id } });

      return addCorsHeaders(
        NextResponse.json({
          success: true,
          action: 'logged_in',
          token,
          user: {
            id: profile.userId,
            name: profile.name,
            email: profile.email,
            phone: cleanPhone,
            role: profile.role,
            agentId: profile.agentId,
            customerId: profile.customerId,
            tenantId: profile.tenantId,
            tenant: profile.tenant,
          },
          profiles,
        }),
        request
      );
    }

    // Multiple profiles or no profile — let user choose
    return addCorsHeaders(
      NextResponse.json({
        success: true,
        action: profiles.length === 0 ? 'new_user' : 'select_profile',
        token,
        phone: cleanPhone,
        profiles,
      }),
      request
    );
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Verification failed' }, { status: 500 }),
      request
    );
  }
}

/**
 * Build all profiles for a phone number.
 * One phone can be linked to multiple businesses as different roles.
 */
async function buildProfiles(phone: string) {
  const profiles: any[] = [];

  // 1. Check User table (admin/owner/super_admin accounts)
  const users = await prisma.user.findMany({
    where: { OR: [{ phone }, { email: phone }] },
    include: { Tenant: true },
  });

  for (const u of users) {
    let currentAgentId = u.agentId;

    // Auto-heal old business owners who don't have a shadow agent yet
    // Skip for super_admin as they don't need shadow agents
    if (u.role === 'admin' && !currentAgentId && u.tenantId) {
      try {
        const newAgent = await prisma.agent.create({
          data: {
            name: u.name || 'Admin',
            phone: u.phone,
            status: 'active',
            tenantId: u.tenantId!,
          },
        });
        await prisma.user.update({
          where: { id: u.id },
          data: { agentId: newAgent.id },
        });
        currentAgentId = newAgent.id;
        console.log(`Auto-created shadow agent ${currentAgentId} for old admin ${u.id}`);
      } catch (err) {
        console.error('Failed to auto-heal admin agentId:', err);
      }
    }

    // Build profile label based on role
    let label = '';
    if (u.role === 'super_admin') {
      label = 'Super Admin (Platform)';
    } else if (u.Tenant) {
      label = `${u.Tenant.name} (${u.role === 'admin' ? 'Admin' : u.role})`;
    } else {
      label = `${u.name} (${u.role})`;
    }

    profiles.push({
      userId: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      agentId: currentAgentId,
      customerId: u.customerId,
      tenantId: u.tenantId,
      tenant: u.Tenant ? { id: u.Tenant.id, name: u.Tenant.name, code: u.Tenant.code } : null,
      label,
    });
  }

  // 2. Check Agent table (agents added by business owners)
  const agents = await prisma.agent.findMany({
    where: { phone, status: 'active' },
    include: { Tenant: true, User: true },
  });

  for (const agent of agents) {
    // Skip if already found via User table
    if (agent.User && profiles.some((p) => p.userId === agent.User!.id)) continue;

    if (agent.User) {
      profiles.push({
        userId: agent.User.id,
        name: agent.name,
        email: agent.User.email,
        role: 'agent',
        agentId: agent.id,
        tenantId: agent.tenantId,
        tenant: { id: agent.Tenant.id, name: agent.Tenant.name, code: agent.Tenant.code },
        label: `${agent.Tenant.name} (Agent)`,
      });
    } else {
      // Agent exists but no User record yet — create one on first login
      profiles.push({
        userId: null, // Will be created on profile select
        name: agent.name,
        email: null,
        role: 'agent',
        agentId: agent.id,
        tenantId: agent.tenantId,
        tenant: { id: agent.Tenant.id, name: agent.Tenant.name, code: agent.Tenant.code },
        label: `${agent.Tenant.name} (Agent)`,
        needsUserCreation: true,
      });
    }
  }

  return profiles;
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
