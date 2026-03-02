import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';
import { createShadowAgent } from '@/lib/shadowAgentHelper';

/**
 * POST /api/agents/create-shadow
 * Create a shadow agent for a regular agent
 * Body: { agentId: string, tenantId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, tenantId } = body;

    if (!agentId || !tenantId) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'agentId and tenantId are required' },
          { status: 400 }
        ),
        request
      );
    }

    // Get the agent
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { User: true },
    });

    if (!agent) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Agent not found' }, { status: 404 }),
        request
      );
    }

    // Check if agent already has a user/shadow account
    if (agent.User) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Agent already has a user account', data: agent.User },
          { status: 400 }
        ),
        request
      );
    }

    // Create a user account for the agent (shadow account)
    const shadowUser = await prisma.user.create({
      data: {
        name: agent.name,
        email: `agent_${agent.id}@shadow.local`,
        phone: agent.phone,
        password: 'shadow-account', // Placeholder - should be set by agent
        role: 'agent',
        tenantId,
        agentId,
      },
    });

    console.log('Shadow user created for agent:', agentId);

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        message: 'Shadow account created for agent',
        data: {
          agent,
          user: shadowUser,
        },
      }),
      request
    );
  } catch (error: any) {
    console.error('Error creating shadow agent:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Failed to create shadow agent', details: error.message },
        { status: 500 }
      ),
      request
    );
  }
}

export async function OPTIONS() {
  return corsOptions();
}
