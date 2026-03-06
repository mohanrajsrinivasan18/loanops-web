/**
 * Product Access Middleware
 * Checks if a tenant has access to a specific product
 */

import { NextRequest, NextResponse } from 'next/server';
import { productControlService, ProductType } from '../services/productControlService';

export async function checkProductAccess(
  tenantId: string,
  productType: ProductType
): Promise<boolean> {
  try {
    return await productControlService.isProductEnabled(tenantId, productType);
  } catch (error) {
    console.error('Error checking product access:', error);
    return false;
  }
}

export function createProductAccessMiddleware(productType: ProductType) {
  return async (request: NextRequest, tenantId: string) => {
    const hasAccess = await checkProductAccess(tenantId, productType);
    
    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: `Product ${productType} is not enabled for this tenant`,
        },
        { status: 403 }
      );
    }
    
    return null; // Access granted
  };
}
