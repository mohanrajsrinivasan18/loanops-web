/**
 * Product Control Service
 * Manages which products are enabled for each tenant
 */

import { prisma } from '../prisma';

export type ProductType = 'LOAN' | 'CHIT' | 'GOLD_LOAN' | 'PERSONAL_LOAN' | 'INSURANCE' | 'SAVINGS';

export const productControlService = {
  /**
   * Get all products for a tenant
   */
  getTenantProducts: async (tenantId: string) => {
    return await prisma.tenantProduct.findMany({
      where: { tenantId },
      orderBy: { productType: 'asc' },
    });
  },

  /**
   * Check if a product is enabled for tenant
   */
  isProductEnabled: async (tenantId: string, productType: ProductType): Promise<boolean> => {
    const product = await prisma.tenantProduct.findUnique({
      where: {
        tenantId_productType: {
          tenantId,
          productType,
        },
      },
    });

    // If no record exists, default to enabled for LOAN, disabled for others
    if (!product) {
      return productType === 'LOAN';
    }

    return product.enabled;
  },

  /**
   * Enable a product for tenant
   */
  enableProduct: async (tenantId: string, productType: ProductType, settings?: any) => {
    return await prisma.tenantProduct.upsert({
      where: {
        tenantId_productType: {
          tenantId,
          productType,
        },
      },
      create: {
        tenantId,
        productType,
        enabled: true,
        settings,
      },
      update: {
        enabled: true,
        settings,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Disable a product for tenant
   */
  disableProduct: async (tenantId: string, productType: ProductType) => {
    return await prisma.tenantProduct.upsert({
      where: {
        tenantId_productType: {
          tenantId,
          productType,
        },
      },
      create: {
        tenantId,
        productType,
        enabled: false,
      },
      update: {
        enabled: false,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Toggle product status
   */
  toggleProduct: async (tenantId: string, productType: ProductType) => {
    const current = await prisma.tenantProduct.findUnique({
      where: {
        tenantId_productType: {
          tenantId,
          productType,
        },
      },
    });

    const newStatus = current ? !current.enabled : true;

    return await prisma.tenantProduct.upsert({
      where: {
        tenantId_productType: {
          tenantId,
          productType,
        },
      },
      create: {
        tenantId,
        productType,
        enabled: newStatus,
      },
      update: {
        enabled: newStatus,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Initialize default products for new tenant
   */
  initializeDefaultProducts: async (tenantId: string) => {
    const defaultProducts: { productType: ProductType; enabled: boolean }[] = [
      { productType: 'LOAN', enabled: true },
      { productType: 'CHIT', enabled: true }, // Enabled by default
      { productType: 'GOLD_LOAN', enabled: false },
      { productType: 'PERSONAL_LOAN', enabled: false },
      { productType: 'INSURANCE', enabled: false },
      { productType: 'SAVINGS', enabled: false },
    ];

    const promises = defaultProducts.map((product) =>
      prisma.tenantProduct.create({
        data: {
          tenantId,
          productType: product.productType,
          enabled: product.enabled,
        },
      })
    );

    return await Promise.all(promises);
  },

  /**
   * Get enabled products for tenant
   */
  getEnabledProducts: async (tenantId: string): Promise<ProductType[]> => {
    const products = await prisma.tenantProduct.findMany({
      where: {
        tenantId,
        enabled: true,
      },
      select: {
        productType: true,
      },
    });

    return products.map((p) => p.productType as ProductType);
  },

  /**
   * Bulk update products for tenant
   */
  bulkUpdateProducts: async (
    tenantId: string,
    products: { productType: ProductType; enabled: boolean; settings?: any }[]
  ) => {
    const promises = products.map((product) =>
      prisma.tenantProduct.upsert({
        where: {
          tenantId_productType: {
            tenantId,
            productType: product.productType,
          },
        },
        create: {
          tenantId,
          productType: product.productType,
          enabled: product.enabled,
          settings: product.settings,
        },
        update: {
          enabled: product.enabled,
          settings: product.settings,
          updatedAt: new Date(),
        },
      })
    );

    return await Promise.all(promises);
  },

  /**
   * Get product statistics across all tenants
   */
  getProductStatistics: async () => {
    const stats = await prisma.tenantProduct.groupBy({
      by: ['productType', 'enabled'],
      _count: true,
    });

    return stats.reduce((acc: any, stat) => {
      if (!acc[stat.productType]) {
        acc[stat.productType] = { enabled: 0, disabled: 0, total: 0 };
      }
      if (stat.enabled) {
        acc[stat.productType].enabled = stat._count;
      } else {
        acc[stat.productType].disabled = stat._count;
      }
      acc[stat.productType].total += stat._count;
      return acc;
    }, {});
  },
};
