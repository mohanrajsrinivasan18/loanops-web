import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function GET(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);

  try {
    const agentId = request.nextUrl.searchParams.get('agentId');
    const tenantId = request.nextUrl.searchParams.get('tenantId');

    if (!agentId) {
      return respond(NextResponse.json({ 
        success: false,
        error: 'Agent ID required' 
      }, { status: 400 }));
    }

    // Get lines assigned to agent and include active customers.
    const lines = await prisma.line.findMany({
      where: {
        agentId,
        ...(tenantId && { tenantId }),
        status: 'active',
      },
      include: {
        Customer: {
          where: { status: 'active' },
          include: {
            Loan: {
              where: { status: 'active' },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const lineSummaries = lines.map((line) => ({
      id: line.id,
      name: line.name,
      area: line.area,
      type: line.type,
      interestRate: line.interestRate,
      customersCount: line.Customer.length,
      activeLoans: line.Customer.reduce((sum, customer) => sum + customer.Loan.length, 0),
      customers: line.Customer,
    }));

    return respond(NextResponse.json({
      success: true,
      data: lineSummaries,
    }));
  } catch (error) {
    console.error('Error fetching agent lines:', error);
    return respond(NextResponse.json({ 
      success: false,
      error: 'Failed to fetch agent lines',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);

  try {
    const body = await request.json();
    const { agentId, customerIds, area } = body;

    if (!agentId) {
      return respond(NextResponse.json({ 
        success: false,
        error: 'Agent ID required' 
      }, { status: 400 }));
    }

    if (!customerIds || !Array.isArray(customerIds)) {
      return respond(NextResponse.json({ 
        success: false,
        error: 'Customer IDs array required' 
      }, { status: 400 }));
    }

    // Assign customers to agent
    await prisma.customer.updateMany({
      where: {
        id: { in: customerIds },
      },
      data: {
        agentId,
        ...(area && { area }),
      },
    });

    return respond(NextResponse.json({
      success: true,
      message: `Assigned ${customerIds.length} customers to agent`,
    }));
  } catch (error: any) {
    console.error('Error assigning customers to agent:', error);
    return respond(NextResponse.json({
      success: false,
      error: 'Failed to assign customers',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function DELETE(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);

  try {
    const agentId = request.nextUrl.searchParams.get('agentId');
    const customerIds = request.nextUrl.searchParams.get('customerIds')?.split(',');

    if (!agentId) {
      return respond(NextResponse.json({ 
        success: false,
        error: 'Agent ID required' 
      }, { status: 400 }));
    }

    // Unassign customers from agent
    await prisma.customer.updateMany({
      where: {
        agentId,
        ...(customerIds && { id: { in: customerIds } }),
      },
      data: {
        agentId: null,
      },
    });

    return respond(NextResponse.json({
      success: true,
      message: 'Customers unassigned from agent',
    }));
  } catch (error: any) {
    console.error('Error unassigning customers:', error);
    return respond(NextResponse.json({
      success: false,
      error: 'Failed to unassign customers',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
