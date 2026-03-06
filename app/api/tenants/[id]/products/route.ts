import { NextRequest, NextResponse } from 'next/server';
import { productControlService } from '@/lib/services/productControlService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const products = await productControlService.getTenantProducts(params.id);
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Error fetching tenant products:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
