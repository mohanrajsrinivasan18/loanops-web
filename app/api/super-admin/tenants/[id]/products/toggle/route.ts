import { NextRequest, NextResponse } from 'next/server';
import { productControlService, ProductType } from '@/lib/services/productControlService';

/**
 * POST /api/super-admin/tenants/[id]/products/toggle
 * Toggle product status for tenant
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { productType } = body;

    if (!productType) {
      return NextResponse.json(
        { success: false, error: 'Product type required' },
        { status: 400 }
      );
    }

    const result = await productControlService.toggleProduct(
      params.id,
      productType as ProductType
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: `Product ${result.enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error: any) {
    console.error('Error toggling product:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
