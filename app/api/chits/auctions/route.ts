import { NextRequest, NextResponse } from 'next/server';
import { chitService } from '@/lib/services/chitService';
import { checkProductAccess } from '@/lib/middleware/productAccess';

/**
 * POST /api/chits/auctions
 * Create chit auction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chitId, monthNumber, auctionDate, tenantId } = body;

    if (!chitId || !monthNumber || !auctionDate || !tenantId) {
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

    const auction = await chitService.createAuction({
      chitId,
      monthNumber: parseInt(monthNumber),
      auctionDate: new Date(auctionDate),
      tenantId,
    });

    return NextResponse.json({
      success: true,
      data: auction,
      message: 'Auction created successfully',
    });
  } catch (error: any) {
    console.error('Error creating auction:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
