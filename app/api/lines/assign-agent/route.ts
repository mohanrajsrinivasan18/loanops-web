import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('=== ASSIGN AGENT TO LINE API ===');
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { lineId, agentId } = body;

    if (!lineId) {
      return addCorsHeaders(NextResponse.json({
        success: false,
        error: 'Line ID is required',
      }, { status: 400 }));
    }

    // Check if line exists
    const line = await prisma.line.findUnique({
      where: { id: lineId },
    });

    if (!line) {
      return addCorsHeaders(NextResponse.json({
        success: false,
        error: 'Line not found',
      }, { status: 404 }));
    }

    // If agentId is provided, verify agent exists
    if (agentId) {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        return addCorsHeaders(NextResponse.json({
          success: false,
          error: 'Agent not found',
        }, { status: 404 }));
      }

      // Verify agent belongs to same tenant
      if (agent.tenantId !== line.tenantId) {
        return addCorsHeaders(NextResponse.json({
          success: false,
          error: 'Agent and line must belong to same tenant',
        }, { status: 400 }));
      }
    }

    // Update line with agent
    const updatedLine = await prisma.line.update({
      where: { id: lineId },
      data: {
        agentId: agentId || null,
        updatedAt: new Date(),
      },
      include: {
        Agent: true,
        Customer: {
          where: { status: 'active' },
        },
      },
    });

    // Also update all customers in this line to have the same agent
    if (agentId) {
      await prisma.customer.updateMany({
        where: {
          lineId,
          status: 'active',
        },
        data: {
          agentId,
        },
      });
    }

    console.log('Agent assigned to line successfully');

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: updatedLine,
      message: agentId 
        ? `Agent assigned to line. ${updatedLine.Customer.length} customers updated.`
        : 'Agent unassigned from line',
    }));
  } catch (error: any) {
    console.error('=== ASSIGN AGENT ERROR ===');
    console.error('Error:', error);
    return addCorsHeaders(NextResponse.json({
      success: false,
      error: 'Failed to assign agent to line',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
