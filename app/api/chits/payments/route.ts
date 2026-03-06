import { NextRequest, NextResponse } from 'next/server';
import { chitService } from '@/lib/services/chitService';

/**
 * POST /api/chits/payments
 * Record chit payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chitId, chitMemberId, monthNumber, amount, paymentDate, tenantId } = body;

    if (!chitId || !chitMemberId || !monthNumber || !amount || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const payment = await chitService.recordPayment({
      chitId,
      chitMemberId,
      monthNumber: parseInt(monthNumber),
      amount: parseFloat(amount),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      tenantId,
    });

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully',
    });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
