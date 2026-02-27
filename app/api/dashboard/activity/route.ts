import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const tenantId = searchParams.get('tenantId');

    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 200));

    const activities = [
      {
        id: 1,
        customerId: 'CUS001',
        customerName: 'Rajesh Kumar',
        action: 'payment_received',
        actionLabel: 'Payment received',
        amount: 5000,
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        type: 'success',
        metadata: {
          loanId: 'LOAN001',
          paymentMethod: 'cash',
          agentId: 'AGT001',
        },
      },
      {
        id: 2,
        customerId: 'CUS002',
        customerName: 'Priya Sharma',
        action: 'loan_disbursed',
        actionLabel: 'New loan disbursed',
        amount: 50000,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        type: 'info',
        metadata: {
          loanId: 'LOAN002',
          tenure: 12,
          interestRate: 24,
        },
      },
      {
        id: 3,
        customerId: 'CUS003',
        customerName: 'Amit Patel',
        action: 'payment_overdue',
        actionLabel: 'Payment overdue',
        amount: 3500,
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        type: 'warning',
        metadata: {
          loanId: 'LOAN003',
          daysOverdue: 3,
        },
      },
      {
        id: 4,
        customerId: 'CUS004',
        customerName: 'Sneha Reddy',
        action: 'loan_completed',
        actionLabel: 'Loan completed',
        amount: 25000,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'success',
        metadata: {
          loanId: 'LOAN004',
          totalPaid: 28000,
        },
      },
      {
        id: 5,
        customerId: 'CUS005',
        customerName: 'Vikram Singh',
        action: 'payment_received',
        actionLabel: 'Payment received',
        amount: 8000,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        type: 'success',
        metadata: {
          loanId: 'LOAN005',
          paymentMethod: 'upi',
        },
      },
      {
        id: 6,
        customerId: 'CUS006',
        customerName: 'Anita Desai',
        action: 'customer_added',
        actionLabel: 'New customer added',
        amount: 0,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        type: 'info',
        metadata: {
          agentId: 'AGT002',
        },
      },
    ];

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: activities.slice(0, limit),
      total: activities.length,
      limit,
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
