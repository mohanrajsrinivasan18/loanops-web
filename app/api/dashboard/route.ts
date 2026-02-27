import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getPeriodWindow(period: string, baseDate: Date) {
  const dayStart = startOfDay(baseDate);
  const dayEnd = addDays(dayStart, 1);

  let from = dayStart;
  if (period === '7d') from = addDays(dayStart, -6);
  else if (period === '30d') from = addDays(dayStart, -29);
  else if (period === '90d') from = addDays(dayStart, -89);

  return {
    dayStart,
    dayEnd,
    from,
    to: dayEnd,
  };
}

export async function GET(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);

  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    const agentId = request.nextUrl.searchParams.get('agentId');
    const period = request.nextUrl.searchParams.get('period') || 'today';
    const dateParam = request.nextUrl.searchParams.get('date');
    const baseDate = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
    const { dayStart, dayEnd, from, to } = getPeriodWindow(period, baseDate);
    
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (agentId) where.agentId = agentId;
    
    // Get counts
    const [
      totalCustomers,
      activeCustomers,
      totalLoans,
      activeLoans,
      totalAgents,
      activeAgents,
    ] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.count({ where: { ...where, status: 'active' } }),
      prisma.loan.count({ where }),
      prisma.loan.count({ where: { ...where, status: 'active' } }),
      prisma.agent.count({ where: tenantId ? { tenantId } : {} }),
      prisma.agent.count({ where: { ...(tenantId ? { tenantId } : {}), status: 'active' } }),
    ]);
    
    // Get financial stats
    const loans = await prisma.loan.findMany({
      where,
      select: {
        amount: true,
        outstanding: true,
      },
    });
    
    const totalDisbursed = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalOutstanding = loans.reduce((sum, loan) => sum + loan.outstanding, 0);
    const totalCollected = totalDisbursed - totalOutstanding;
    
    // Day collections for selected base date
    const dayCollections = await prisma.collection.findMany({
      where: {
        ...where,
        dueDate: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
      select: {
        amount: true,
        status: true,
        collectedAmount: true,
      },
    });
    
    const todayTarget = dayCollections.reduce((sum, col) => sum + col.amount, 0);
    const todayCollected = dayCollections
      .filter(col => col.status === 'collected')
      .reduce((sum, col) => sum + (col.collectedAmount || 0), 0);

    // Period collections (today/7d/30d/90d)
    const periodCollections = await prisma.collection.findMany({
      where: {
        ...where,
        dueDate: {
          gte: from,
          lt: to,
        },
      },
      select: {
        amount: true,
        status: true,
        collectedAmount: true,
      },
    });
    const periodTarget = periodCollections.reduce((sum, col) => sum + col.amount, 0);
    const periodCollected = periodCollections
      .filter(col => col.status === 'collected')
      .reduce((sum, col) => sum + (col.collectedAmount || 0), 0);
    
    // Get this month's collections
    const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const monthCollections = await prisma.collection.findMany({
      where: {
        ...where,
        status: 'collected',
        collectedDate: {
          gte: startOfMonth,
        },
      },
      select: {
        collectedAmount: true,
      },
    });
    
    const monthlyCollected = monthCollections.reduce(
      (sum, col) => sum + (col.collectedAmount || 0),
      0
    );
    
    return respond(NextResponse.json({
      customers: {
        total: totalCustomers,
        active: activeCustomers,
      },
      loans: {
        total: totalLoans,
        active: activeLoans,
      },
      agents: {
        total: totalAgents,
        active: activeAgents,
      },
      financial: {
        totalDisbursed,
        totalOutstanding,
        totalCollected,
      },
      collections: {
        today: {
          target: todayTarget,
          collected: todayCollected,
          pending: todayTarget - todayCollected,
        },
        period: {
          key: period,
          from: from.toISOString(),
          to: to.toISOString(),
          target: periodTarget,
          collected: periodCollected,
          pending: periodTarget - periodCollected,
        },
        monthly: {
          collected: monthlyCollected,
        },
      },
    }));
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return respond(NextResponse.json({ 
      success: false,
      error: 'Failed to fetch dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
