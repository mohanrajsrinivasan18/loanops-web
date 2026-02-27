import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: { Tenant: true },
    });

    if (!agent) {
      return addCorsHeaders(NextResponse.json({ error: 'Agent not found' }, { status: 404 }));
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Run all queries in parallel
    const [
      totalCustomers,
      activeCustomers,
      activeLoans,
      thisMonthCollections,
      lastMonthCollections,
      todayCollections,
      todayPending,
      allTimeCollected,
    ] = await Promise.all([
      // Total customers assigned
      prisma.customer.count({ where: { agentId: id } }),
      // Active customers
      prisma.customer.count({ where: { agentId: id, status: 'active' } }),
      // Active loans
      prisma.loan.count({ where: { agentId: id, status: 'active' } }),
      // This month's collections
      prisma.collection.findMany({
        where: {
          agentId: id,
          status: 'collected',
          collectedDate: { gte: startOfMonth },
        },
        select: { collectedAmount: true },
      }),
      // Last month's collections
      prisma.collection.findMany({
        where: {
          agentId: id,
          status: 'collected',
          collectedDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        select: { collectedAmount: true },
      }),
      // Today's collected
      prisma.collection.findMany({
        where: {
          agentId: id,
          status: 'collected',
          collectedDate: { gte: startOfDay, lte: endOfDay },
        },
        select: { collectedAmount: true },
      }),
      // Today's pending
      prisma.collection.findMany({
        where: {
          agentId: id,
          status: 'pending',
          dueDate: { gte: startOfDay, lte: endOfDay },
        },
        select: { amount: true },
      }),
      // All-time collected
      prisma.collection.findMany({
        where: { agentId: id, status: 'collected' },
        select: { collectedAmount: true },
      }),
    ]);

    const thisMonthTotal = thisMonthCollections.reduce((sum, c) => sum + (c.collectedAmount || 0), 0);
    const lastMonthTotal = lastMonthCollections.reduce((sum, c) => sum + (c.collectedAmount || 0), 0);
    const todayTotal = todayCollections.reduce((sum, c) => sum + (c.collectedAmount || 0), 0);
    const todayPendingTotal = todayPending.reduce((sum, c) => sum + c.amount, 0);
    const allTimeTotal = allTimeCollected.reduce((sum, c) => sum + (c.collectedAmount || 0), 0);

    // Growth percentage
    const monthlyGrowth = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    // Collection efficiency (target vs actual)
    const targetCollection = agent.targetCollection || 0;
    const efficiency = targetCollection > 0
      ? (thisMonthTotal / targetCollection) * 100
      : 0;

    // Daily collection trend (last 7 days)
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999);

      const dayCollections = await prisma.collection.findMany({
        where: {
          agentId: id,
          status: 'collected',
          collectedDate: { gte: dayStart, lte: dayEnd },
        },
        select: { collectedAmount: true },
      });

      dailyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        amount: dayCollections.reduce((sum, c) => sum + (c.collectedAmount || 0), 0),
        count: dayCollections.length,
      });
    }

    return addCorsHeaders(NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        phone: agent.phone,
        area: agent.area,
        status: agent.status,
        targetCollection: agent.targetCollection,
      },
      customers: {
        total: totalCustomers,
        active: activeCustomers,
      },
      loans: {
        active: activeLoans,
      },
      collections: {
        today: {
          collected: todayTotal,
          pending: todayPendingTotal,
          count: todayCollections.length,
        },
        thisMonth: {
          collected: thisMonthTotal,
          count: thisMonthCollections.length,
        },
        lastMonth: {
          collected: lastMonthTotal,
          count: lastMonthCollections.length,
        },
        allTime: {
          collected: allTimeTotal,
          count: allTimeCollected.length,
        },
      },
      performance: {
        efficiency: Math.round(efficiency * 100) / 100,
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
        dailyTrend,
      },
    }));
  } catch (error) {
    console.error('Error fetching agent performance:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch agent performance' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
