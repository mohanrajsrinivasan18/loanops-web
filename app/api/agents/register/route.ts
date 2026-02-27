import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';
import bcrypt from 'bcryptjs';

function sanitizeEmail(email?: string | null): string | null {
  const value = email?.trim().toLowerCase();
  if (!value) return null;
  return value;
}

function buildFallbackEmail(phone: string, tenantId: string): string {
  const tenantPart = tenantId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'tenant';
  return `agent.${phone}@${tenantPart}.local`;
}

export async function POST(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  try {
    const body = await request.json();
    console.log('=== REGISTER AGENT API ===');
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { tenantId, name, phone, email, area, password } = body;
    const cleanedEmail = sanitizeEmail(email);

    // Validate required fields
    if (!tenantId) {
      return respond(NextResponse.json({
        success: false,
        error: 'Tenant ID is required',
      }, { status: 400 }));
    }
    if (!name) {
      return respond(NextResponse.json({
        success: false,
        error: 'Name is required',
      }, { status: 400 }));
    }
    if (!phone) {
      return respond(NextResponse.json({
        success: false,
        error: 'Phone is required',
      }, { status: 400 }));
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return respond(NextResponse.json({
        success: false,
        error: 'Tenant not found',
      }, { status: 404 }));
    }

    // Check if phone already exists
    const existingByPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingByPhone) {
      return respond(NextResponse.json({
        success: false,
        error: 'Phone number already registered',
      }, { status: 400 }));
    }

    // User.email is required in Prisma schema. Use provided email or generate one.
    let finalEmail = cleanedEmail || buildFallbackEmail(phone, tenantId);
    const existingByEmail = await prisma.user.findUnique({ where: { email: finalEmail } });
    if (existingByEmail) {
      // Keep deterministic and unique if generated/provided email already exists.
      finalEmail = `agent.${phone}.${Date.now()}@${tenantId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'tenant'}.local`;
    }

    // Generate password if not provided (last 4 digits of phone)
    const finalPassword = password || phone.slice(-4);
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    // Create user and agent in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create agent
      const agent = await tx.agent.create({
        data: {
          id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          phone,
          email: cleanedEmail,
          area: area || null,
          status: 'active',
          tenantId,
        },
        include: {
          User: {
            select: {
              id: true,
              phone: true,
              email: true,
              role: true,
            },
          },
          Tenant: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          phone,
          email: finalEmail,
          password: hashedPassword,
          role: 'agent',
          name,
          tenantId,
          agentId: agent.id,
        },
      });

      return { user, agent };
    });

    console.log('Agent registered successfully:', result.agent.id);

    return respond(NextResponse.json({
      success: true,
      data: {
        Agent: result.agent,
        user: {
          id: result.user.id,
          phone: result.user.phone,
          role: result.user.role,
        },
        credentials: {
          phone,
          password: finalPassword,
          message: 'Agent can login with phone number and password',
        },
      },
    }));
  } catch (error: any) {
    console.error('=== REGISTER AGENT ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    if (error.code) console.error('Error code:', error.code);

    return respond(NextResponse.json({
      success: false,
      error: 'Failed to register agent',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
