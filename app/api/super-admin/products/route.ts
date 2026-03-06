import { NextRequest, NextResponse } from 'next/server';
import { productControlService } from '@/lib/services/productControlService';

/**
 * GET /api/super-admin/products
 * Get product statistics across all tenants
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await productControlService.getProductStatistics();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching product statistics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
