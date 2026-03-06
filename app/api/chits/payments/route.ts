import { NextRequest, NextResponse } from 'next/server';
import { chitService } from '@/lib/services/chitService';
import { checkProductAccess } from '@/lib/middleware/productAccess';

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

    // Check product access
    const hasAccess = await checkProductAccess(tenantId, 'CHIT');
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Chit product is not enabled for this tenant' },
        { status: 403 }
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
