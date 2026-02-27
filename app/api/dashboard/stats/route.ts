import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

// Mock data - Replace with actual database queries
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '7d';
    const tenantId = searchParams.get('tenantId');

    // Simulate database query delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock statistics
    const stats = {
      totalCustomers: {
        value: 3926,
        change: 12.5,
        trend: 'up',
        previous: 3489,
      },
      activeLoans: {
        value: 2847,
        change: 8.2,
        trend: 'up',
        previous: 2631,
      },
      totalOutstanding: {
        value: 2480000,
        change: -3.1,
        trend: 'down',
        previous: 2559000,
      },
      collectionRate: {
        value: 94.2,
        change: 2.4,
        trend: 'up',
        previous: 91.8,
      },
      todayCollection: {
        expected: 125000,
        collected: 118000,
        pending: 7000,
        rate: 94.4,
      },
      weeklyCollection: {
        expected: 875000,
        collected: 823000,
        pending: 52000,
        rate: 94.1,
      },
      monthlyCollection: {
        expected: 3500000,
        collected: 3290000,
        pending: 210000,
        rate: 94.0,
      },
    };

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: stats,
      timeRange,
      tenantId,
    }));
  } catch (error: any) {
    return addCorsHeaders(NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
