import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const date = searchParams.get('date');

    if (!agentId || !date) {
      return addCorsHeaders(NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'agentId and date are required'
          }
        },
        { status: 400 }
      ));
    }

    const targetDate = new Date(date + 'T00:00:00.000Z');
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');

    // Get collections for the day (status = collected/paid)
    const collections = await prisma.collection.findMany({
      where: {
        agentId,
        status: { in: ['collected', 'paid'] },
        OR: [
          { collectedDate: { gte: startOfDay, lte: endOfDay } },
          { dueDate: { gte: startOfDay, lte: endOfDay }, collectedDate: null },
        ],
      },
      include: {
        Customer: { select: { name: true, phone: true } },
      },
    });

    const totalCollection = collections.reduce((sum, c) => sum + (c.collectedAmount || c.amount || 0), 0);

    // Get loans disbursed on the day
    const loans = await prisma.loan.findMany({
      where: {
        agentId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        Customer: { select: { name: true, phone: true } },
      },
    });

    const totalGiven = loans.reduce((sum, l) => sum + l.amount, 0);

    // Get expenses from AuditLog (most recent entry for this agent+date)
    const entityId = `${agentId}_${date}`;
    const expenseLog = await prisma.auditLog.findFirst({
      where: {
        entity: 'DailyTracking',
        entityId,
        action: 'DAILY_TRACKING',
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalExpenses = 0;
    let expenseBreakdown: any[] = [];

    if (expenseLog?.changes) {
      const changes = expenseLog.changes as any;
      totalExpenses = changes.expenses || 0;
      expenseBreakdown = changes.expenseBreakdown || [];
    }

    const irupu = totalCollection - totalGiven - totalExpenses;

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: {
        date,
        agentId,
        collection: totalCollection,
        given: totalGiven,
        expenses: totalExpenses,
        irupu,
        collectionsCount: collections.length,
        loansCount: loans.length,
        expenseBreakdown,
      }
    }));

  } catch (error: any) {
    console.error('Get daily tracking error:', error);
    return addCorsHeaders(NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch daily tracking'
        }
      },
      { status: 500 }
    ));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      date,
      agentId,
      collection,
      given,
      expenses,
      expenseBreakdown,
      tenantId = 'default'
    } = body;

    if (!date || !agentId) {
      return addCorsHeaders(NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'date and agentId are required'
          }
        },
        { status: 400 }
      ));
    }

    const irupu = (collection || 0) - (given || 0) - (expenses || 0);

    // Store in audit log for tracking
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        tenantId,
        userId: agentId,
        action: 'DAILY_TRACKING',
        entity: 'DailyTracking',
        entityId: `${agentId}_${date}`,
        changes: {
          date,
          collection,
          given,
          expenses,
          irupu,
          expenseBreakdown
        },
        createdAt: new Date()
      }
    });

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: {
        date,
        agentId,
        collection,
        given,
        expenses,
        irupu,
        expenseBreakdown
      }
    }));

  } catch (error: any) {
    console.error('Record daily tracking error:', error);
    return addCorsHeaders(NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to record daily tracking'
        }
      },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
