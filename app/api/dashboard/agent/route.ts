import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get('agentId');

    if (!agentId) {
      return addCorsHeaders(NextResponse.json({ error: 'agentId is required' }, { status: 400 }));
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return addCorsHeaders(NextResponse.json({ error: 'Agent not found' }, { status: 404 }));
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel
    const [
      totalCustomers,
      activeLoans,
      todaysDueCollections,
      todaysCollected,
      monthlyCollected,
      recentCollections,
      pendingCustomers,
    ] = await Promise.all([
      // Agent's customer count
      prisma.customer.count({ where: { agentId } }),
      // Agent's active loans
      prisma.loan.count({ where: { agentId, status: 'active' } }),
      // Today's due collections for this agent
      prisma.collection.findMany({
        where: {
          agentId,
          dueDate: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          Customer: { select: { id: true, name: true, phone: true, address: true, lat: true, lng: true } },
          Loan: { select: { id: true, amount: true, outstanding: true, loanType: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
      // Today's collected amount
      prisma.collection.findMany({
        where: {
          agentId,
          status: 'collected',
          collectedDate: { gte: startOfDay, lte: endOfDay },
        },
        select: { collectedAmount: true },
      }),
      // Monthly collected
      prisma.collection.findMany({
        where: {
          agentId,
          status: 'collected',
          collectedDate: { gte: startOfMonth },
        },
        select: { collectedAmount: true },
      }),
      // Recent 10 collections
      prisma.collection.findMany({
        where: { agentId, status: 'collected' },
        include: {
          Customer: { select: { name: true, phone: true } },
        },
        orderBy: { collectedDate: 'desc' },
        take: 10,
      }),
      // Pending customers for today (not yet collected)
      prisma.collection.findMany({
        where: {
          agentId,
          status: 'pending',
          dueDate: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          Customer: { select: { id: true, name: true, phone: true, address: true, lat: true, lng: true } },
          Loan: { select: { id: true, loanType: true, outstanding: true } },
        },
        orderBy: { amount: 'desc' },
      }),
    ]);

    const todayTarget = todaysDueCollections.reduce((sum, c) => sum + c.amount, 0);
    const todayCollectedAmount = todaysCollected.reduce((sum, c) => sum + (c.collectedAmount || 0), 0);
    const monthlyCollectedAmount = monthlyCollected.reduce((sum, c) => sum + (c.collectedAmount || 0), 0);
    const collectionRate = todayTarget > 0 ? (todayCollectedAmount / todayTarget) * 100 : 0;

    return addCorsHeaders(NextResponse.json({
      Agent: {
        id: agent.id,
        name: agent.name,
        area: agent.area,
        targetCollection: agent.targetCollection,
      },
      summary: {
        totalCustomers,
        activeLoans,
        todayTarget,
        todayCollected: todayCollectedAmount,
        todayPending: todayTarget - todayCollectedAmount,
        collectionRate: Math.round(collectionRate * 100) / 100,
        monthlyCollected: monthlyCollectedAmount,
        monthlyTarget: agent.targetCollection,
      },
      todaysSchedule: todaysDueCollections.map((c) => ({
        id: c.id,
        Customer: c.Customer,
        Loan: c.Loan,
        amount: c.amount,
        status: c.status,
        dueDate: c.dueDate,
      })),
      pendingCustomers: pendingCustomers.map((c) => ({
        id: c.id,
        Customer: c.Customer,
        Loan: c.Loan,
        amount: c.amount,
      })),
      recentActivity: recentCollections.map((c) => ({
        id: c.id,
        customerName: c.Customer.name,
        amount: c.collectedAmount,
        method: c.method,
        collectedDate: c.collectedDate,
      })),
    }));
  } catch (error) {
    console.error('Error fetching agent dashboard:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch agent dashboard' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
