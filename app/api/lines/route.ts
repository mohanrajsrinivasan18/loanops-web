import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

function buildDayWindow(asOfDate?: string | null) {
  const base = asOfDate ? new Date(`${asOfDate}T00:00:00`) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function normalizeDateOnly(asOfDate?: string | null) {
  const date = asOfDate ? new Date(`${asOfDate}T00:00:00`) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function GET(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);

  // Test if this function is even being called
  console.log('=== LINES API GET CALLED ===');
  console.log('Prisma client exists:', !!prisma);
  console.log('Prisma type:', typeof prisma);

  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    const lineId = request.nextUrl.searchParams.get('lineId');
    const agentId = request.nextUrl.searchParams.get('agentId');
    const asOfDate = request.nextUrl.searchParams.get('asOfDate');
    const { start: dayStart, end: dayEnd } = buildDayWindow(asOfDate);

    console.log('=== LINES API GET ===');
    console.log('Query params:', { tenantId, lineId, agentId, asOfDate });

    // Get specific line
    if (lineId) {
      console.log('Fetching line by ID:', lineId);
      console.log('About to call prisma.line.findUnique');
      
      const line = await prisma.line.findUnique({
        where: { id: lineId },
        include: {
          Agent: true,
          Tenant: true,
          Customer: {
            where: { status: 'active' },
            include: {
              Loan: {
                where: { status: 'active' },
              },
            },
          },
        },
      });

      if (!line) {
        console.log('Line not found:', lineId);
        return respond(NextResponse.json({
          success: false,
          error: 'Line not found',
        }, { status: 404 }));
      }

      console.log('Line found:', line.id, 'with', line.Customer.length, 'customers');

      const financeDate = normalizeDateOnly(asOfDate);
      console.log('Looking for daily finance for date:', financeDate);
      
      const dailyFinance = await prisma.lineDailyFinance.findUnique({
        where: {
          lineId_date: {
            lineId: line.id,
            date: financeDate,
          },
        },
      });

      console.log('Daily finance found:', dailyFinance ? 'yes' : 'no');

      // Calculate stats
      const stats = {
        customersCount: line.Customer.length,
        totalLoans: line.Customer.reduce((sum, c) => sum + c.Loan.length, 0),
        totalAmount: line.Customer.reduce((sum, c) => 
          sum + c.Loan.reduce((loanSum, loan) => loanSum + loan.amount, 0), 0
        ),
        outstanding: line.Customer.reduce((sum, c) => 
          sum + c.Loan.reduce((loanSum, loan) => loanSum + loan.outstanding, 0), 0
        ),
      };

      console.log('Calculated stats:', stats);

      const response = {
        success: true,
        data: {
          ...line,
          stats,
          dailyFinance: dailyFinance || {
            lineId: line.id,
            date: financeDate,
            collectionAmount: 0,
            investmentAmount: 0,
            expenseAmount: 0,
          },
        },
      };

      console.log('Returning response with data');
      return respond(NextResponse.json(response));
    }

    // Get lines by agent
    if (agentId) {
      const lines = await prisma.line.findMany({
        where: {
          agentId,
          status: 'active',
        },
        include: {
          Agent: true,
          Customer: {
            where: { status: 'active' },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const linesWithStats = lines.map(line => ({
        ...line,
        customersCount: line.Customer.length,
      }));

      return respond(NextResponse.json({
        success: true,
        data: linesWithStats,
      }));
    }

    // Get lines by tenant
    if (tenantId) {
      const lines = await prisma.line.findMany({
        where: {
          tenantId,
          status: 'active',
        },
        include: {
          Agent: true,
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

      const collectionsForDay = await prisma.collection.findMany({
        where: {
          tenantId,
          status: 'collected',
          collectedDate: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        select: {
          customerId: true,
          collectedAmount: true,
        },
      });

      const collectedByCustomer = new Map<string, number>();
      for (const collection of collectionsForDay) {
        const current = collectedByCustomer.get(collection.customerId) || 0;
        collectedByCustomer.set(
          collection.customerId,
          current + (Number(collection.collectedAmount) || 0)
        );
      }

      const linesWithStats = lines.map(line => ({
        id: line.id,
        name: line.name,
        area: line.area,
        type: line.type,
        weeklyDay: line.weeklyDay,
        interestRate: line.interestRate,
        agentId: line.agentId,
        agentName: line.Agent?.name,
        status: line.status,
        customersCount: line.Customer.length,
        totalLoans: line.Customer.reduce((sum, c) => sum + c.Loan.length, 0),
        totalAmount: line.Customer.reduce((sum, c) => 
          sum + c.Loan.reduce((loanSum, loan) => loanSum + loan.amount, 0), 0
        ),
        outstanding: line.Customer.reduce((sum, c) => 
          sum + c.Loan.reduce((loanSum, loan) => loanSum + loan.outstanding, 0), 0
        ),
        periodCollected: line.Customer.reduce(
          (sum, customer) => sum + (collectedByCustomer.get(customer.id) || 0),
          0
        ),
        createdAt: line.createdAt,
      }));

      return respond(NextResponse.json({
        success: true,
        data: linesWithStats,
      }));
    }

    return respond(NextResponse.json({
      success: false,
      error: 'tenantId or lineId required',
    }, { status: 400 }));
  } catch (error) {
    console.error('Error fetching lines:', error);
    return respond(NextResponse.json({
      success: false,
      error: 'Failed to fetch lines',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  try {
    const body = await request.json();
    console.log('=== CREATE LINE API ===');
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { name, area, type, weeklyDay, interestRate, agentId, tenantId } = body;

    // Validate required fields
    if (!name) {
      return respond(NextResponse.json({
        success: false,
        error: 'Line name is required',
      }, { status: 400 }));
    }

    if (!area) {
      return respond(NextResponse.json({
        success: false,
        error: 'Area is required',
      }, { status: 400 }));
    }

    if (!tenantId) {
      console.log('ERROR: Missing tenantId in request');
      return respond(NextResponse.json({
        success: false,
        error: 'Tenant ID is required',
      }, { status: 400 }));
    }

    console.log('Creating line for tenant:', tenantId, 'with name:', name);

    const normalizedType = type || 'daily';
    if (normalizedType === 'weekly' && !weeklyDay) {
      return respond(NextResponse.json({
        success: false,
        error: 'weeklyDay is required for weekly lines',
      }, { status: 400 }));
    }

    // Check if line with same name exists for this tenant (only active lines)
    const existingLine = await prisma.line.findFirst({
      where: {
        name,
        tenantId,
        status: 'active', // Only check active lines
      },
    });

    if (existingLine) {
      console.log('Duplicate line found:', existingLine.id, 'for tenant:', tenantId);
      return respond(NextResponse.json({
        success: false,
        error: 'Line with this name already exists for your organization',
      }, { status: 400 }));
    }

    // Create line
    const line = await prisma.line.create({
      data: {
        id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        area,
        type: normalizedType,
        weeklyDay: normalizedType === 'weekly' ? weeklyDay : null,
        interestRate: interestRate || 2.5,
        agentId: agentId || null,
        tenantId,
        status: 'active',
        updatedAt: new Date(),
      },
      include: {
        Agent: true,
        Tenant: true,
      },
    });

    console.log('Line created successfully:', line.id);

    return respond(NextResponse.json({
      success: true,
      data: line,
    }));
  } catch (error: any) {
    console.error('=== CREATE LINE ERROR ===');
    console.error('Error:', error);
    return respond(NextResponse.json({
      success: false,
      error: 'Failed to create line',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function PUT(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return respond(NextResponse.json({
        success: false,
        error: 'Line ID required',
      }, { status: 400 }));
    }

    const updatedType = updates.type || undefined;
    if (updatedType === 'weekly' && !updates.weeklyDay) {
      return respond(NextResponse.json({
        success: false,
        error: 'weeklyDay is required for weekly lines',
      }, { status: 400 }));
    }

    if (updatedType && updatedType !== 'weekly') {
      updates.weeklyDay = null;
    }

    const line = await prisma.line.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        Agent: true,
      },
    });

    return respond(NextResponse.json({
      success: true,
      data: line,
    }));
  } catch (error: any) {
    console.error('Error updating line:', error);
    return respond(NextResponse.json({
      success: false,
      error: 'Failed to update line',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function DELETE(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  try {
    const lineId = request.nextUrl.searchParams.get('lineId');

    if (!lineId) {
      return respond(NextResponse.json({
        success: false,
        error: 'Line ID required',
      }, { status: 400 }));
    }

    // Check if line has customers
    const customersCount = await prisma.customer.count({
      where: { lineId },
    });

    if (customersCount > 0) {
      return respond(NextResponse.json({
        success: false,
        error: `Cannot delete line with ${customersCount} customers. Please reassign customers first.`,
      }, { status: 400 }));
    }

    // Soft delete - set status to inactive
    const line = await prisma.line.update({
      where: { id: lineId },
      data: { 
        status: 'inactive',
        updatedAt: new Date(),
      },
    });

    return respond(NextResponse.json({
      success: true,
      message: 'Line deactivated successfully',
      data: line,
    }));
  } catch (error: any) {
    console.error('Error deleting line:', error);
    return respond(NextResponse.json({
      success: false,
      error: 'Failed to delete line',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
