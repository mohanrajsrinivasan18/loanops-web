import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

function sanitizeEmail(email?: string | null): string | null {
  const value = email?.trim().toLowerCase();
  if (!value) return null;
  return value;
}

function buildFallbackEmail(phone: string, tenantId: string): string {
  const tenantPart = tenantId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'tenant';
  return `agent.${phone}@${tenantPart}.local`;
}

export async function GET(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    const status = request.nextUrl.searchParams.get('status');
    const id = request.nextUrl.searchParams.get('id');

    // Single agent fetch
    if (id) {
      const agent = await prisma.agent.findUnique({
        where: { id },
        include: {
          User: true,
          Tenant: true,
          Customer: {
            where: { status: 'active' },
          },
          Loan: {
            where: { status: 'active' },
          },
        },
      });

      if (!agent) {
        return respond(NextResponse.json({
          success: false,
          error: 'Agent not found',
        }, { status: 404 }));
      }

      return respond(NextResponse.json({
        success: true,
        data: agent,
      }));
    }

    // Build filters
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (status) where.status = status;

    const agents = await prisma.agent.findMany({
      where,
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
        _count: {
          select: {
            Customer: true,
            Loan: true,
          },
        },
        Line: {
          where: { status: 'active' },
          select: {
            id: true,
            name: true,
            area: true,
            _count: {
              select: {
                Customer: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Line-based customer count avoids confusion when an agent has direct customers
    // but no lines assigned. Expose both values.
    const transformedAgents = agents.map(agent => ({
      ...agent,
      customersCount: agent.Line.reduce((sum, line) => sum + (line._count?.Customer || 0), 0),
      directCustomersCount: agent._count.Customer,
      assignedLinesCount: agent.Line.length,
      activeLoansCount: agent._count.Loan,
    }));

    return respond(NextResponse.json({
      success: true,
      data: transformedAgents,
    }));
  } catch (error) {
    console.error('Error fetching agents:', error);
    return respond(NextResponse.json({
      success: false,
      error: 'Failed to fetch agents',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  try {
    const body = await request.json();
    console.log('=== CREATE AGENT API ===');
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { tenantId, name, phone, email, area, password } = body;
    const cleanedEmail = sanitizeEmail(email);

    // Validate required fields
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

    // Use provided tenantId or get first tenant as default
    let finalTenantId = tenantId;
    if (!finalTenantId) {
      const firstTenant = await prisma.tenant.findFirst();
      if (!firstTenant) {
        return respond(NextResponse.json({
          success: false,
          error: 'No tenant found. Please create a tenant first.',
        }, { status: 400 }));
      }
      finalTenantId = firstTenant.id;
      console.log('Using default tenant:', finalTenantId);
    }

    // Check if phone already exists for this tenant
    const existingByPhone = await prisma.user.findFirst({ 
      where: { 
        phone,
        tenantId: finalTenantId,
      } 
    });
    if (existingByPhone) {
      return respond(NextResponse.json({
        success: false,
        error: 'Phone number already registered in your organization',
      }, { status: 400 }));
    }

    // User.email is required in Prisma schema. Use provided email or generate one.
    let finalEmail = cleanedEmail || buildFallbackEmail(phone, finalTenantId);
    const existingByEmail = await prisma.user.findUnique({ where: { email: finalEmail } });
    if (existingByEmail) {
      finalEmail = `agent.${phone}.${Date.now()}@${finalTenantId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'tenant'}.local`;
    }

    // Generate password if not provided (last 4 digits of phone)
    const finalPassword = password || phone.slice(-4);
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    // Create user and agent in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create agent
      const agent = await tx.agent.create({
        data: {
          id: `agent_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          name,
          phone,
          email: cleanedEmail,
          area: area || null,
          status: 'active',
          tenantId: finalTenantId,
        },
        include: {
          Tenant: true,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          phone,
          email: finalEmail,
          password: hashedPassword,
          role: 'agent',
          name,
          tenantId: finalTenantId,
          agentId: agent.id,
        },
      });

      return { user, agent };
    });

    console.log('Agent created successfully:', result.agent.id);

    return respond(NextResponse.json({
      success: true,
      data: {
        Agent: result.agent,
        user: result.user,
        credentials: {
          phone,
          password: finalPassword,
          message: 'Agent can login with phone number and password',
        },
      },
    }));
  } catch (error: any) {
    console.error('=== CREATE AGENT ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    if (error.code) console.error('Error code:', error.code);

    return respond(NextResponse.json({
      success: false,
      error: 'Failed to create agent',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function PUT(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  try {
    const body = await request.json();
    console.log('=== UPDATE AGENT API ===');
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { id, ...updates } = body;

    if (!id) {
      return respond(NextResponse.json({
        success: false,
        error: 'Agent ID required',
      }, { status: 400 }));
    }

    const existingAgent = await prisma.agent.findUnique({
      where: { id },
      include: { User: true },
    });

    if (!existingAgent) {
      return respond(NextResponse.json({
        success: false,
        error: 'Agent not found',
      }, { status: 404 }));
    }

    // Clean up the updates object
    const cleanUpdates: any = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.phone !== undefined) cleanUpdates.phone = updates.phone;
    if (updates.email !== undefined) cleanUpdates.email = updates.email || null;
    if (updates.area !== undefined) cleanUpdates.area = updates.area || null;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;

    const normalizedEmail = updates.email !== undefined ? sanitizeEmail(updates.email) : undefined;
    let finalUserEmail = existingAgent.User?.email || buildFallbackEmail(cleanUpdates.phone || existingAgent.phone, existingAgent.tenantId);
    if (normalizedEmail !== undefined && normalizedEmail !== null) {
      finalUserEmail = normalizedEmail;
    }
    if (normalizedEmail === null) {
      finalUserEmail = buildFallbackEmail(cleanUpdates.phone || existingAgent.phone, existingAgent.tenantId);
    }

    const agent = await prisma.$transaction(async (tx) => {
      const updatedAgent = await tx.agent.update({
        where: { id },
        data: cleanUpdates,
        include: {
          User: true,
          Tenant: true,
        },
      });

      if (updatedAgent.User?.id) {
        await tx.user.update({
          where: { id: updatedAgent.User.id },
          data: {
            name: cleanUpdates.name ?? updatedAgent.name,
            phone: cleanUpdates.phone ?? updatedAgent.phone,
            email: finalUserEmail,
          },
        });
      }

      return tx.agent.findUnique({
        where: { id },
        include: {
          User: true,
          Tenant: true,
        },
      });
    });

    if (!agent) {
      throw new Error('Agent update verification failed');
    }

    console.log('Agent updated successfully:', agent.id);

    return respond(NextResponse.json({
      success: true,
      data: agent,
    }));
  } catch (error: any) {
    console.error('=== UPDATE AGENT ERROR ===');
    console.error('Error:', error);

    return respond(NextResponse.json({
      success: false,
      error: 'Failed to update agent',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function DELETE(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return respond(NextResponse.json({
        success: false,
        error: 'Agent ID required',
      }, { status: 400 }));
    }

    // Check if agent exists and has dependencies
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        User: true,
        Line: true,
        Customer: true,
        Loan: { where: { status: 'active' } },
      },
    });

    if (!agent) {
      return respond(NextResponse.json({
        success: false,
        error: 'Agent not found',
      }, { status: 404 }));
    }

    // Block delete if agent has assigned lines
    if (agent.Line && agent.Line.length > 0) {
      const lineNames = agent.Line.map(l => l.name).join(', ');
      return respond(NextResponse.json({
        success: false,
        error: `Cannot delete agent with ${agent.Line.length} assigned line(s): ${lineNames}. Unassign lines first.`,
      }, { status: 400 }));
    }

    // Block delete if agent has active loans
    if (agent.Loan && agent.Loan.length > 0) {
      return respond(NextResponse.json({
        success: false,
        error: `Cannot delete agent with ${agent.Loan.length} active loan(s). Close all loans first.`,
      }, { status: 400 }));
    }

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Unlink customers from this agent (set agentId to null)
      await tx.customer.updateMany({
        where: { agentId: id },
        data: { agentId: null },
      });

      // Delete collections linked to this agent
      await tx.collection.deleteMany({ where: { agentId: id } });

      // Delete completed loans linked to this agent
      await tx.loan.updateMany({
        where: { agentId: id },
        data: { agentId: null },
      });

      // Delete agent
      await tx.agent.delete({ where: { id } });

      // Delete associated user
      if (agent.User && agent.User.id) {
        await tx.user.delete({ where: { id: agent.User.id } });
      }
    });

    return respond(NextResponse.json({
      success: true,
      message: 'Agent deleted successfully',
    }));
  } catch (error: any) {
    console.error('Error deleting agent:', error);
    return respond(NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete agent',
    }, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
