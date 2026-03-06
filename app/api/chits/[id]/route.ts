import { NextRequest, NextResponse } from 'next/server';
import { chitService } from '@/lib/services/chitService';
import { checkProductAccess } from '@/lib/middleware/productAccess';

/**
 * GET /api/chits/[id]
 * Get chit by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
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

    const chit = await chitService.getById(params.id, tenantId);

    if (!chit) {
      return NextResponse.json(
        { success: false, error: 'Chit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: chit,
    });
  } catch (error: any) {
    console.error('Error fetching chit:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chits/[id]
 * Update chit
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const tenantId = body.tenantId;
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    const chit = await chitService.update(params.id, tenantId, body);

    return NextResponse.json({
      success: true,
      data: chit,
      message: 'Chit updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating chit:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chits/[id]
 * Delete chit
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    await chitService.delete(params.id, tenantId);

    return NextResponse.json({
      success: true,
      message: 'Chit deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting chit:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
