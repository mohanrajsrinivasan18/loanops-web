import { NextRequest, NextResponse } from 'next/server';
import { chitService } from '@/lib/services/chitService';
import { checkProductAccess } from '@/lib/middleware/productAccess';

/**
 * POST /api/chits/members
 * Add member to chit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chitId, customerId, memberNumber, tenantId } = body;

    if (!chitId || !customerId || !memberNumber || !tenantId) {
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

    const member = await chitService.addMember({
      chitId,
      customerId,
      memberNumber: parseInt(memberNumber),
      tenantId,
    });

    return NextResponse.json({
      success: true,
      data: member,
      message: 'Member added successfully',
    });
  } catch (error: any) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
