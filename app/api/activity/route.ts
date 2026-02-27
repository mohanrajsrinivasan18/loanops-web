import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export async function GET(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);

  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    // Get recent collections (payments)
    const recentCollections = await prisma.collection.findMany({
      where: {
        ...where,
        status: 'collected',
        collectedDate: { not: null },
      },
      orderBy: { collectedDate: 'desc' },
      take: limit,
      include: {
        Customer: {
          select: { name: true },
        },
      },
    });

    // Get recent loans
    const recentLoans = await prisma.loan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        Customer: {
          select: { name: true },
        },
      },
    });

    // Get recent customers
    const recentCustomers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    // Combine and format activities
    const activities: any[] = [];

    // Add collection activities
    recentCollections.forEach((col) => {
      activities.push({
        id: `col-${col.id}`,
        customer: col.Customer.name,
        action: 'Payment received',
        amount: `₹${col.collectedAmount?.toLocaleString('en-IN') || '0'}`,
        time: formatTimeAgo(col.collectedDate!),
        type: 'success',
        timestamp: col.collectedDate!.getTime(),
      });
    });

    // Add loan activities
    recentLoans.forEach((loan) => {
      const isCompleted = loan.status === 'completed';
      const isOverdue = loan.status === 'overdue';

      activities.push({
        id: `loan-${loan.id}`,
        customer: loan.Customer.name,
        action: isCompleted ? 'Loan completed' : isOverdue ? 'Payment overdue' : 'New loan disbursed',
        amount: `₹${loan.amount.toLocaleString('en-IN')}`,
        time: formatTimeAgo(loan.createdAt),
        type: isCompleted ? 'success' : isOverdue ? 'warning' : 'info',
        timestamp: loan.createdAt.getTime(),
      });
    });

    // Add customer activities
    recentCustomers.forEach((customer) => {
      activities.push({
        id: `cust-${customer.id}`,
        customer: customer.name,
        action: 'New customer added',
        amount: '₹0',
        time: formatTimeAgo(customer.createdAt),
        type: 'info',
        timestamp: customer.createdAt.getTime(),
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    const limitedActivities = activities.slice(0, limit);

    // Remove timestamp before sending
    limitedActivities.forEach((activity) => delete activity.timestamp);

    return respond(
      NextResponse.json({
        success: true,
        data: limitedActivities,
      })
    );
  } catch (error) {
    console.error('Error fetching activity:', error);
    return respond(
      NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch activity',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
