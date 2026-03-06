import { NextRequest, NextResponse } from 'next/server';
import { productControlService } from '@/lib/services/productControlService';

/**
 * GET /api/super-admin/tenants/[id]/products
 * Get all products for a tenant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const products = await productControlService.getTenantProducts(params.id);

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error('Error fetching tenant products:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/super-admin/tenants/[id]/products
 * Bulk update products for tenant
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { products } = body;

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: 'Products array required' },
        { status: 400 }
      );
    }

    const result = await productControlService.bulkUpdateProducts(
      params.id,
      products
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Products updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating tenant products:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
